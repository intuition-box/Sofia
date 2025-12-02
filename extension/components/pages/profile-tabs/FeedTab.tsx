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
  amount?: string // Amount in TRUST tokens
  amountLabel?: string // e.g., "shares" or "assets"
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
        query GetTrustCircle($where: triples_bool_exp, $walletAddress: String!) {
          triples(where: $where) {
            object {
              label
              term_id
              type
            }
            term {
              vaults(where: {curve_id: {_eq: "1"}}, order_by: {curve_id: asc}) {
                positions(where: {account_id: {_eq: $walletAddress}}) {
                  account_id
                  shares
                }
              }
            }
          }
        }
      `

      const trustCircleWhere = {
        "_and": [
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
        where: trustCircleWhere,
        walletAddress: checksumAddress
      }) as { triples: Array<{ object: any; term: { vaults: Array<{ positions: Array<any> }> } }> }

      // Filter client-side: only keep triples where user has positions
      const triplesWithPositions = trustCircleResponse.triples?.filter(triple => {
        const vault = triple.term?.vaults?.[0]
        return vault && vault.positions && vault.positions.length > 0
      }) || []

      if (triplesWithPositions.length === 0) {
        setFeedItems([])
        setLoading(false)
        return
      }

      // Get wallet addresses for these Account atoms via separate query
      const accountTermIds = triplesWithPositions.map(t => t.object.term_id)

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
      // Using the exact query structure from task.md that works on Intuition portal
      const feedQuery = `
        query GetEvents($limit: Int, $offset: Int, $orderBy: [events_order_by!], $where: events_bool_exp) {
          events(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
            id
            block_number
            created_at
            type
            transaction_hash
            atom_id
            triple_id
            deposit_id
            redemption_id
            atom {
              term_id
              data
              image
              label
              type
              wallet_id
              creator {
                id
                label
                image
              }
            }
            triple {
              term_id
              creator {
                label
                image
                id
                atom_id
                type
              }
              subject {
                term_id
                data
                image
                label
                type
              }
              predicate {
                term_id
                data
                image
                label
                type
              }
              object {
                term_id
                data
                image
                label
                type
              }
            }
            deposit {
              curve_id
              sender_id
              sender {
                id
                atom_id
                label
                image
              }
              shares
              assets_after_fees
            }
            redemption {
              curve_id
              sender_id
              sender {
                id
                atom_id
                label
                image
              }
              assets
              shares
            }
          }
        }
      `

      // Build the where clause to filter by Trust Circle accounts
      const whereClause = {
        "_and": [
          {
            "type": {
              "_neq": "FeesTransfered"
            }
          },
          {
            "_or": [
              { "atom": { "creator": { "id": { "_in": walletAddresses } } } },
              { "triple": { "creator": { "id": { "_in": walletAddresses } } } }
            ]
          }
        ]
      }

      const feedResponse = await intuitionGraphqlClient.request(feedQuery, {
        limit: 500,
        offset: 0,
        orderBy: [{ "created_at": "desc" }],
        where: whereClause
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
        // Skip Deposited events with 0 assets_after_fees
        if (event.type === 'Deposited' && event.deposit?.assets_after_fees === '0') {
          continue
        }

        console.log('📊 Processing event:', event.type, event)
        let accountLabel = ''
        let accountWallet = ''
        let accountImage = ''
        let description = ''
        let details = ''
        let portalLink = ''
        let amount: string | undefined = undefined
        let amountLabel: string | undefined = undefined

        // Process events
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
          // For deposits, use the sender from deposit object
          accountWallet = event.deposit.sender_id
          accountLabel = walletToLabel.get(event.deposit.sender_id.toLowerCase()) || event.deposit.sender?.label
          accountImage = event.deposit.sender?.image
          description = 'deposited on'

          // Determine what was deposited on (atom or triple)
          if (event.atom) {
            details = event.atom.label
            portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
          } else if (event.triple) {
            details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label}`
            portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          }

          // Extract deposit amount (assets_after_fees converted to TRUST)
          if (event.deposit.assets_after_fees) {
            const assetsInTRUST = Number(event.deposit.assets_after_fees) / 1e18
            amount = assetsInTRUST.toFixed(4)
            amountLabel = 'TRUST'
          }
        } else if (event.type === 'Redeemed' && event.redemption) {
          // For redemptions, use the sender from redemption object
          accountWallet = event.redemption.sender_id
          accountLabel = walletToLabel.get(event.redemption.sender_id.toLowerCase()) || event.redemption.sender?.label
          accountImage = event.redemption.sender?.image
          description = 'redeemed from'

          // Determine what was redeemed from (atom or triple)
          if (event.atom) {
            details = event.atom.label
            portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
          } else if (event.triple) {
            details = `${event.triple.subject.label} ${event.triple.predicate.label} ${event.triple.object.label}`
            portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          }

          // Extract redemption amount (assets converted to TRUST)
          if (event.redemption.assets) {
            const assetsInTRUST = Number(event.redemption.assets) / 1e18
            amount = assetsInTRUST.toFixed(4)
            amountLabel = 'TRUST'
          }
        }

        // Check if this event is from someone in the Trust Circle
        const isInTrustCircle = accountWallet && walletAddresses.some(w => w.toLowerCase() === accountWallet.toLowerCase())

        if (accountLabel && accountWallet && isInTrustCircle) {
          console.log('✅ Adding feed event:', { accountLabel, accountWallet, accountImage, description, details, amount, amountLabel })
          feedEvents.push({
            id: event.id,
            type: event.type,
            created_at: event.created_at,
            accountLabel,
            accountWallet,
            accountImage,
            description,
            details,
            portalLink,
            amount,
            amountLabel
          })
        } else {
          console.log('⚠️ Skipping event - not in Trust Circle or no accountLabel:', event.type, { accountWallet, isInTrustCircle })
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
                      {item.amount && item.amountLabel && (
                        <>
                          {' '}
                          <span className="feed-amount">
                            ({item.amount} {item.amountLabel})
                          </span>
                        </>
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
