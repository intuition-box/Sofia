import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import { getAddress } from 'viem'
import { useWeightOnChain } from '../../../hooks/useWeightOnChain'
import UpvoteModal from '../../modals/UpvoteModal'
import Avatar from '../../ui/Avatar'
import '../../styles/CoreComponents.css'
import '../../styles/PageBlockchainCard.css'
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
  accountWallet: string
  accountImage?: string
  description: string
  details: string
  portalLink?: string
}

const FeedTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [feedItems, setFeedItems] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null)
  const [isUpvoteModalOpen, setIsUpvoteModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [declinedEvents, setDeclinedEvents] = useStorage<string[]>("declined-feed-events", [])
  const { addWeight, removeWeight } = useWeightOnChain()


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
              "_eq": PREDICATE_IDS.TRUSTS
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
                image
              }
            }
            triple {
              term_id
              creator {
                id
                label
                image
              }
              subject { term_id, label }
              predicate { term_id, label }
              object { term_id, label }
            }
            deposit {
              sender {
                id
                label
                image
              }
              shares
              assets_after_fees
            }
            redemption {
              sender {
                id
                label
                image
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
        let accountWallet = ''
        let accountImage = ''
        let description = ''
        let details = ''

        // Determine account and data based on event type
        let portalLink = ''
        if (event.type === 'AtomCreated' && event.atom) {
          accountWallet = event.atom.creator.id
          accountLabel = walletToLabel.get(event.atom.creator.id.toLowerCase()) || event.atom.creator.label
          accountImage = event.atom.creator.image
          description = 'created identity'
          details = event.atom.label
          portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
        } else if (event.type === 'TripleCreated' && event.triple) {
          accountWallet = event.triple.creator.id
          accountLabel = walletToLabel.get(event.triple.creator.id.toLowerCase()) || event.triple.creator.label
          accountImage = event.triple.creator.image
          description = 'created claim'
          details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label}`
          portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
        } else if (event.type === 'Deposited' && event.deposit) {
          accountWallet = event.deposit.sender.id
          accountLabel = walletToLabel.get(event.deposit.sender.id.toLowerCase()) || event.deposit.sender.label
          accountImage = event.deposit.sender.image
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
          accountWallet = event.redemption.sender.id
          accountLabel = walletToLabel.get(event.redemption.sender.id.toLowerCase()) || event.redemption.sender.label
          accountImage = event.redemption.sender.image
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

        if (accountLabel && accountWallet) {
          console.log('✅ Adding feed event:', { accountLabel, accountWallet, accountImage, description, details })
          feedEvents.push({
            id: event.id,
            type: event.type,
            created_at: event.created_at,
            accountLabel,
            accountWallet,
            accountImage,
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

  const handleJoinClick = (item: FeedEvent, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSelectedEvent(item)
    setIsUpvoteModalOpen(true)
  }

  const handleDeclineClick = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Add this event to the declined list
    setDeclinedEvents((prev) => [...(prev || []), itemId])
  }

  const handleCloseModal = () => {
    setIsUpvoteModalOpen(false)
    setSelectedEvent(null)
  }

  const handleSubmit = async (newUpvotes: number) => {
    if (!selectedEvent) return

    // Determine the vault ID (term_id) to deposit on
    let vaultId: string | null = null

    // For AtomCreated or deposits/redemptions on atoms, use atom term_id
    if (selectedEvent.type === 'AtomCreated' || (selectedEvent.portalLink?.includes('/atom/'))) {
      const match = selectedEvent.portalLink?.match(/\/atom\/(.+)$/)
      vaultId = match ? match[1] : null
    }
    // For TripleCreated or deposits/redemptions on triples, use triple term_id
    else if (selectedEvent.type === 'TripleCreated' || (selectedEvent.portalLink?.includes('/triple/'))) {
      const match = selectedEvent.portalLink?.match(/\/triple\/(.+)$/)
      vaultId = match ? match[1] : null
    }

    if (!vaultId) {
      console.error('No vault ID found for this event')
      return
    }

    try {
      setIsProcessing(true)

      // Convert upvotes to Wei: 1 upvote = 0.001 ETH = 10^15 Wei
      const depositAmount = BigInt(Math.floor(newUpvotes)) * BigInt(10 ** 15)

      console.log('💰 Deposit calculation:', {
        upvotes: newUpvotes,
        depositAmount: depositAmount.toString(),
        depositInETH: (Number(depositAmount) / 10**18).toFixed(4)
      })

      const result = await addWeight(vaultId, depositAmount)

      if (result.success) {
        console.log('✅ Successfully joined:', result.txHash)
        handleCloseModal()
        // Refresh the feed after successful deposit
        await loadTrustCircleFeed()
      } else {
        console.error('❌ Failed to join:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ Error joining:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
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
        <p className="feed-subtitle">
        </p>
      </div>

      {feedItems.length > 0 ? (
        <div className="feed-items">
          {feedItems
            .filter((item) => !declinedEvents?.includes(item.id))
            .map((item) => {
              // Can only join on deposits/redemptions (vault already exists with liquidity)
              // Cannot join on newly created atoms/triples (no initial deposit yet)
              const canJoin = item.portalLink && (item.type === 'Deposited' || item.type === 'Redeemed')

              // Determine category based on type
              let category = 'Activity'
              if (item.type === 'AtomCreated') category = 'Identity'
              else if (item.type === 'TripleCreated') category = 'Claim'
              else if (item.type === 'Deposited') category = 'Deposit'
              else if (item.type === 'Redeemed') category = 'Redemption'

              return (
                <div key={item.id} className="feed-item-container">
                  <Avatar
                    imgSrc={item.accountImage}
                    name={item.accountWallet}
                    avatarClassName="feed-avatar"
                    size="medium"
                  />

                  <div className="feed-content">
                    <div className="feed-text">
                      <span className="feed-account-name">{item.accountLabel}</span>
                      {' '}
                      <span className="feed-action">{item.description}</span>
                      {' '}
                      {item.portalLink ? (
                        <a
                          href={item.portalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="feed-details-link"
                        >
                          {item.details}
                        </a>
                      ) : (
                        <span className="feed-details-text">{item.details}</span>
                      )}
                    </div>
                    <div className="feed-meta">
                      <span className="feed-timestamp">{formatTimestamp(item.created_at)}</span>
                      <span className="feed-separator">·</span>
                      <span className="feed-category">{category}</span>
                    </div>
                    {canJoin && (
                      <div className="feed-actions">
                        <button
                          className="trust-page-button join-button-css"
                          onClick={(e) => handleJoinClick(item, e)}
                        >
                          <span className="trust-button-content">Join</span>
                        </button>
                        <button
                          className="feed-decline-button"
                          onClick={(e) => handleDeclineClick(item.id, e)}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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

      <UpvoteModal
        isOpen={isUpvoteModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        objectName={selectedEvent ? selectedEvent.details : ''}
        objectType={selectedEvent?.type === 'AtomCreated' ? 'Identity' : 'Claim'}
        currentUpvotes={0}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default FeedTab
