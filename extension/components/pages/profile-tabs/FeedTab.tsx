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

interface FeedTriplet {
  id: string
  subject: { label: string; term_id: string }
  predicate: { label: string; term_id: string }
  object: { label: string; term_id: string }
  created_at: string
  accountLabel: string
  shares: string
}

const FeedTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [feedItems, setFeedItems] = useState<FeedTriplet[]>([])
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
        query GetTrustCircle($where: triples_bool_exp, $walletAddress: String!) {
          triples(where: $where) {
            object {
              label
              term_id
              type
              atom {
                value {
                  thing { url }
                  person { url }
                  organization { url }
                }
              }
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
        where: trustCircleWhere,
        walletAddress: checksumAddress
      }) as { triples: Array<{ object: any }> }

      // Extract wallet addresses from Account atoms
      const trustCircleAccounts: TrustCircleAccount[] = []

      for (const triple of trustCircleResponse.triples || []) {
        const obj = triple.object
        // Account atoms store wallet address in their data
        let walletAddr = ''

        // Try to extract wallet from atom value
        if (obj.atom?.value?.thing?.url) {
          walletAddr = obj.atom.value.thing.url
        } else if (obj.atom?.value?.person?.url) {
          walletAddr = obj.atom.value.person.url
        } else if (obj.atom?.value?.organization?.url) {
          walletAddr = obj.atom.value.organization.url
        }

        trustCircleAccounts.push({
          termId: obj.term_id,
          label: obj.label,
          wallet: walletAddr || obj.label
        })
      }

      console.log('📊 Trust Circle accounts:', trustCircleAccounts)

      if (trustCircleAccounts.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      // Step 2: Get all positions (triplets) that these accounts have staked on
      // We need to query by wallet addresses in the positions
      const walletAddresses = trustCircleAccounts
      if (walletAddresses.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      const feedQuery = `
        query GetTrustCircleFeed($walletAddresses: [String!]!) {
          triples: terms(
            where: {
                {
                  term: {
                    vaults: {
                      positions: {
                        account: {
                          id: { _in: $walletAddresses }
                        }
                      }
                    }
                  }
                }
            },
            order_by: { created_at: desc },
            limit: 100
          ) {
            id
            triple {
              subject { term_id, label }
              predicate { term_id, label }
              object { term_id, label }
            }
            created_at
            term {
              vaults(where: { curve_id: { _eq: "1" } }) {
                positions(where: { account: { id: { _in: $walletAddresses } } }) {
                  account { id, label }
                  shares
                  created_at
                }
              }
            }
          }
        }
      `

      const feedResponse = await intuitionGraphqlClient.request(feedQuery, {
      }) as { triples: Array<any> }

      console.log('📊 Feed response:', feedResponse)

      // Create wallet to label mapping
      const walletToLabel = new Map(
        trustCircleAccounts.map(acc => [acc.wallet.toLowerCase(), acc.label])
      )

      const feedItems: FeedTriplet[] = []

      for (const triple of feedResponse.triples || []) {
        // Get all positions from accounts in trust circle
        const positions = triple.term?.vaults?.[0]?.positions || []

        for (const position of positions) {
          const walletAddr = position.account.id.toLowerCase()
          const accountLabel = walletToLabel.get(walletAddr) || position.account.label

          feedItems.push({
            id: `${triple.id}-${position.account.id}`,
            subject: triple.triple.subject,
            predicate: triple.triple.predicate,
            object: triple.triple.object,
            created_at: position.created_at || triple.created_at,
            accountLabel,
            shares: position.shares
          })
        }
      }

      // Sort by date
      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setFeedItems(feedItems)

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
          {feedItems.map((item) => (
            <div key={item.id} className="feed-item">
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
                <p className="feed-triplet">
                  <span className="subject">{item.subject.label}</span>{' '}
                  <span className="predicate">{item.predicate.label}</span>{' '}
                  <span className="object">{item.object.label}</span>
                </p>
                <div className="feed-shares">
                  💎 {(parseFloat(item.shares) / 1e18).toFixed(3)} shares
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No activity yet</p>
          <p className="empty-subtext">
            Accounts in your Trust Circle haven't staked on any triplets yet.
          </p>
        </div>
      )}
    </div>
  )
}

export default FeedTab
