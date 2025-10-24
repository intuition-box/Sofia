import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import { getAddress } from 'viem'
import '../../styles/CoreComponents.css'
import '../../styles/FeedTab.css'

interface TrustCircleAccount {
  termId: string
  label: string
  wallet: string
}

interface FeedEvent {
  id: string
  type: string
  created_at: string
  accountLabel: string
  description: string
  details: string
  portalLink?: string
}

const FeedTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [feedItems, setFeedItems] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    loadTrustCircleFeed()
  }, [address])

  const loadTrustCircleFeed = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!address) {
        setError('No account connected')
        return
      }

      const checksumAddress = getAddress(address)

      // Step 1: Get all accounts in my Trust Circle
      const trustCircleQuery = `
        query GetTrustCircle($where: triples_bool_exp) {
          triples(where: $where) {
            object {
              label
              term_id
              type
            }
          }
        }
      `

      const trustCircleWhere = {
        "_and": [
          {
            "positions": {
              "account": {
                "id": {
                  "_eq": checksumAddress
                }
              }
            }
          },
          {
            "subject_id": {
              "_eq": SUBJECT_IDS.I
            }
          },
          {
            "predicate_id": {
              "_eq": PREDICATE_IDS.TRUST
            }
          },
          {
            "object": {
              "type": {
                "_eq": "Account"
              }
            }
          }
        ]
      }

      const trustCircleResponse = await intuitionGraphqlClient.request(trustCircleQuery, {
        where: trustCircleWhere
      }) as { triples: Array<{ object: any }> }

      if (!trustCircleResponse.triples || trustCircleResponse.triples.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      // Get wallet addresses for these Account atoms via separate query
      const accountTermIds = trustCircleResponse.triples.map(t => t.object.term_id)

      const atomsQuery = `
        query GetAccountAtoms($termIds: [String!]!) {
          atoms(where: { term_id: { _in: $termIds } }) {
            term_id
            label
            data
          }
        }
      `

      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, {
        termIds: accountTermIds
      }) as { atoms: Array<{ term_id: string; label: string; data: string }> }

      // Extract wallet addresses from Account atoms
      const trustCircleAccounts: TrustCircleAccount[] = atomsResponse.atoms?.map(atom => ({
        termId: atom.term_id,
        label: atom.label,
        wallet: atom.data || atom.label // data contains the wallet address
      })) || []

      console.log('📊 Trust Circle accounts:', trustCircleAccounts)

      if (trustCircleAccounts.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      // Step 2: Get all activity events from these accounts using the events table
      // Include both lowercase and checksum versions
      const walletAddressesLower = trustCircleAccounts
        .map(acc => acc.wallet.toLowerCase())
        .filter(w => w.startsWith('0x'))

      const walletAddressesChecksum = trustCircleAccounts
        .map(acc => {
          try {
            return getAddress(acc.wallet)
          } catch {
            return acc.wallet
          }
        })
        .filter(w => w.startsWith('0x'))

      // Combine both to cover all cases
      const walletAddresses = [...new Set([...walletAddressesLower, ...walletAddressesChecksum])]

      console.log('📊 Wallet addresses for feed query (combined):', walletAddresses)

      if (walletAddresses.length === 0) {
        console.log('⚠️ No valid wallet addresses found')
        setFeedItems([])
        setLoading(false)
        return
      }

      // Use the events table to get all activity from Trust Circle accounts
      const feedQuery = `
        query TrustCircleActivity($walletAddresses: [String!]!, $limit: Int = 50) {
          events(
            limit: $limit
            order_by: {created_at: desc}
            where: {
              _or: [
                {atom: {creator: {id: {_in: $walletAddresses}}}},
                {triple: {creator: {id: {_in: $walletAddresses}}}},
                {deposit: {sender: {id: {_in: $walletAddresses}}}},
                {redemption: {sender: {id: {_in: $walletAddresses}}}}
              ]
            }
          ) {
            id
            created_at
            type
            transaction_hash
            atom {
              term_id
              label
              type
              image
              creator {
                id
                label
              }
            }
            triple {
              term_id
              creator {
                id
                label
              }
              subject { term_id, label }
              predicate { term_id, label }
              object { term_id, label }
            }
            deposit {
              sender {
                id
                label
              }
              shares
              assets_after_fees
            }
            redemption {
              sender {
                id
                label
              }
              shares
              assets
            }
          }
        }
      `

      const feedResponse = await intuitionGraphqlClient.request(feedQuery, {
        walletAddresses,
        limit: 50
      }) as { events: Array<any> }

      console.log('📊 Feed response:', feedResponse)
      console.log('📊 Events count:', feedResponse.events?.length || 0)
      console.log('📊 Events:', feedResponse.events)

      // Create wallet to label mapping
      const walletToLabel = new Map(
        trustCircleAccounts.map(acc => [acc.wallet.toLowerCase(), acc.label])
      )

      const feedEvents: FeedEvent[] = []

      for (const event of feedResponse.events || []) {
        console.log('📊 Processing event:', event.type, event)
        let accountLabel = ''
        let description = ''
        let details = ''

        // Determine account and data based on event type
        let portalLink = ''
        if (event.type === 'AtomCreated' && event.atom) {
          accountLabel = walletToLabel.get(event.atom.creator.id.toLowerCase()) || event.atom.creator.label
          description = 'created identity'
          details = event.atom.label
          portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
        } else if (event.type === 'TripleCreated' && event.triple) {
          accountLabel = walletToLabel.get(event.triple.creator.id.toLowerCase()) || event.triple.creator.label
          description = 'created claim'
          details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label}`
          portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
        } else if (event.type === 'Deposited' && event.deposit) {
          accountLabel = walletToLabel.get(event.deposit.sender.id.toLowerCase()) || event.deposit.sender.label
          const amount = (parseFloat(event.deposit.assets_after_fees) / 1e18).toFixed(4)

          if (event.atom) {
            description = 'deposited on'
            details = `${event.atom.label} (${amount} WETH)`
            portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
          } else if (event.triple) {
            description = 'deposited on'
            details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label} (${amount} WETH)`
            portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          } else {
            description = 'deposited'
            details = `${amount} WETH`
          }
        } else if (event.type === 'Redeemed' && event.redemption) {
          accountLabel = walletToLabel.get(event.redemption.sender.id.toLowerCase()) || event.redemption.sender.label
          const amount = (parseFloat(event.redemption.assets) / 1e18).toFixed(4)

          if (event.atom) {
            description = 'redeemed from'
            details = `${event.atom.label} (${amount} WETH)`
            portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
          } else if (event.triple) {
            description = 'redeemed from'
            details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label} (${amount} WETH)`
            portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          } else {
            description = 'redeemed'
            details = `${amount} WETH`
          }
        }

        if (accountLabel) {
          console.log('✅ Adding feed event:', { accountLabel, description, details })
          feedEvents.push({
            id: event.id,
            type: event.type,
            created_at: event.created_at,
            accountLabel,
            description,
            details,
            portalLink
          })
        } else {
          console.log('⚠️ Skipping event - no accountLabel:', event.type)
        }
      }

      console.log('📊 Total feed events:', feedEvents.length)
      setFeedItems(feedEvents)

    } catch (error) {
      console.error('❌ Failed to load Trust Circle feed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getAvatarColor = (label: string) => {
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    ]
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }


  if (!address) {
    return (
      <div className="feed-tab">
        <div className="empty-state">
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view your Trust Circle feed.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="feed-tab">
        <div className="loading-state">
          <p>Loading feed...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="feed-tab">
        <div className="error-state">
          <h3>Error Loading Feed</h3>
          <p>{error}</p>
          <button onClick={loadTrustCircleFeed} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-tab">
      <div className="feed-header">
        <h2>Trust Circle Activity</h2>
        <p className="feed-subtitle">
          Recent activity from accounts you trust
        </p>
      </div>

      {feedItems.length > 0 ? (
        <div className="feed-items">
          {feedItems.map((item) => {
            const FeedItemWrapper = item.portalLink ? 'a' : 'div'
            const wrapperProps = item.portalLink ? {
              href: item.portalLink,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'feed-item feed-item-clickable'
            } : {
              className: 'feed-item'
            }

            return (
              <FeedItemWrapper key={item.id} {...wrapperProps}>
                <div className="feed-item-header">
                  <div
                    className="feed-avatar"
                    style={{ backgroundColor: getAvatarColor(item.accountLabel) }}
                  >
                    {item.accountLabel.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="feed-item-meta">
                    <span className="feed-account-name">{item.accountLabel}</span>
                    <span className="feed-timestamp">{formatTimestamp(item.created_at)}</span>
                  </div>
                </div>
                <div className="feed-item-content">
                  <p className="feed-description">
                    <span className="feed-action">{item.description}</span>
                  </p>
                  <p className="feed-details">{item.details}</p>
                </div>
              </FeedItemWrapper>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No activity yet</p>
          <p className="empty-subtext">
            Accounts in your Trust Circle haven't had any activity yet.
          </p>
        </div>
      )}
    </div>
  )
}

export default FeedTab
