import { useState, useEffect } from 'react'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { 
  useGetTrustCircleAccountsQuery,
  useGetSofiaTrustedActivityQuery
} from '@0xsofia/graphql'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import { SOFIA_PROXY_ADDRESS } from '../../../lib/config/chainConfig'
import { getAddress } from 'viem'
import { useWeightOnChain } from '../../../hooks/useWeightOnChain'
import StakeModal from '../../modals/StakeModal'
import Avatar from '../../ui/Avatar'
import '../../styles/CoreComponents.css'
import '../../styles/PageBlockchainCard.css'
import '../../styles/FeedTab.css'

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
  objectUrl?: string
  amount?: string
  amountLabel?: string
}

const FeedTab = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const [feedItems, setFeedItems] = useState<FeedEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null)
  const [selectedVaultId, setSelectedVaultId] = useState<string>('')
  const [isUpvoteModalOpen, setIsUpvoteModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shouldRefreshOnClose, setShouldRefreshOnClose] = useState(false)
  const [declinedEvents, setDeclinedEvents] = useState<string[]>([])
  const [trustedWallets, setTrustedWallets] = useState<string[]>([])
  const [walletToLabel, setWalletToLabel] = useState<Map<string, string>>(new Map())
  const { addWeight } = useWeightOnChain()

  const checksumAddress = address ? getAddress(address) : ''

  console.log('🔍 FeedTab - Address:', address, 'Checksum:', checksumAddress)
  console.log('🔍 FeedTab - SOFIA_PROXY_ADDRESS:', SOFIA_PROXY_ADDRESS)

  // Step 1: Get Trust Circle accounts
  const { data: trustCircleData, isLoading: trustCircleLoading, error: trustCircleError } = useGetTrustCircleAccountsQuery(
    {
      subjectId: SUBJECT_IDS.I,
      predicateId: PREDICATE_IDS.TRUSTS,
      walletAddress: checksumAddress
    },
    {
      enabled: !!checksumAddress,
      refetchOnWindowFocus: false
    }
  )

  console.log('📊 Trust Circle Query - Loading:', trustCircleLoading, 'Error:', trustCircleError)
  console.log('📊 Trust Circle Data:', trustCircleData)

  // Extract trusted wallets from Trust Circle data
  useEffect(() => {
    if (!trustCircleData?.triples) {
      console.log('⚠️ No trust circle data available')
      return
    }

    console.log('📊 Processing Trust Circle - Total triples:', trustCircleData.triples.length)

    // Filter client-side: only keep triples where user has positions (curve_id=2)
    const triplesWithPositions = trustCircleData.triples.filter(triple => {
      const vault = triple.term?.vaults?.[0]
      const hasPosition = vault && vault.positions && vault.positions.length > 0
      console.log('  Triple:', triple.object?.label, 'Has position:', hasPosition)
      return hasPosition
    })

    console.log('📊 Triples with positions:', triplesWithPositions.length)

    if (triplesWithPositions.length === 0) {
      console.log('⚠️ No triples with positions found')
      setTrustedWallets([])
      return
    }

    // Extract wallet addresses from object.accounts
    const wallets: string[] = []
    const labelMap = new Map<string, string>()

    for (const triple of triplesWithPositions) {
      const accounts = triple.object?.accounts || []
      const label = triple.object?.label || ''

      console.log('  Object:', label, 'Accounts:', accounts.length)

      for (const account of accounts) {
        if (account?.id) {
          try {
            const checksumWallet = getAddress(account.id)
            wallets.push(checksumWallet)
            wallets.push(checksumWallet.toLowerCase())
            labelMap.set(checksumWallet.toLowerCase(), account.label || label || checksumWallet)
            console.log('    ✅ Added wallet:', checksumWallet, 'Label:', account.label || label)
          } catch {
            console.log('    ❌ Invalid wallet address:', account.id)
            continue
          }
        }
      }
    }

    const uniqueWallets = [...new Set(wallets)]
    console.log('📊 Trusted wallets:', uniqueWallets.slice(0, 5), '...')

    setTrustedWallets(uniqueWallets)
    setWalletToLabel(labelMap)
  }, [trustCircleData])

  // Step 2: Get events from trusted wallets
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useGetSofiaTrustedActivityQuery(
    {
      trustedWallets: trustedWallets,
      proxy: SOFIA_PROXY_ADDRESS,
      limit: 500,
      offset: 0
    },
    {
      enabled: trustedWallets.length > 0,
      refetchOnWindowFocus: false
    }
  )

  console.log('📊 Events Query - Enabled:', trustedWallets.length > 0, 'Loading:', eventsLoading, 'Error:', eventsError)
  console.log('📊 Events Data:', eventsData?.events?.length || 0, 'events')

  // Process events into feed items
  useEffect(() => {
    if (!eventsData?.events) {
      console.log('⚠️ No events data available')
      return
    }

    console.log('📊 Processing', eventsData.events.length, 'events')

    // Events are already filtered by the SofiaTrustedActivity query
    // No need for additional filtering
    const feedEvents: FeedEvent[] = []

    for (const event of eventsData.events) {
      let accountLabel = ''
      let accountWallet = ''
      let accountImage = ''
      let description = ''
      let details = ''
      let portalLink = ''
      let objectUrl = ''
      let amount = ''
      let amountLabel = ''

      if (event.type === 'Deposited' && event.deposit) {
        // Sender is proxy, show the receiver (the actual user from Trust Circle)
        const receiver = event.deposit.receiver
        accountLabel = receiver?.label || walletToLabel.get(receiver?.id?.toLowerCase() || '') || 'User'
        accountWallet = receiver?.id || ''
        accountImage = receiver?.image || ''
        description = 'deposited into'
        
        if (event.atom) {
          details = event.atom.label || 'Unknown'
          portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
        } else if (event.triple) {
          details = `${event.triple.subject?.label || '?'} • ${event.triple.predicate?.label || '?'} • ${event.triple.object?.label || '?'}`
          portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          
          const objectWithValue = event.triple.object as { 
            label?: string | null
            term_id: string
            value?: { thing?: { url?: string | null } | null } | null 
          }
          objectUrl = objectWithValue?.value?.thing?.url || ''
        }
        
        amount = (parseFloat(event.deposit.assets_after_fees || '0') / 1e18).toFixed(4)
        amountLabel = 'TRUST'
      } 
      else if (event.type === 'Redeemed' && event.redemption) {
        // Sender is the trusted user who redeemed
        const sender = event.redemption.sender
        accountLabel = sender?.label || walletToLabel.get(sender?.id?.toLowerCase() || '') || 'User'
        accountWallet = sender?.id || ''
        accountImage = sender?.image || ''
        description = 'redeemed from'
        
        if (event.atom) {
          details = event.atom.label || 'Unknown'
          portalLink = `https://portal.intuition.systems/explore/atom/${event.atom.term_id}`
        } else if (event.triple) {
          details = `${event.triple.subject?.label || '?'} • ${event.triple.predicate?.label || '?'} • ${event.triple.object?.label || '?'}`
          portalLink = `https://portal.intuition.systems/explore/triple/${event.triple.term_id}`
          
          const objectWithValue = event.triple.object as { 
            label?: string | null
            term_id: string
            value?: { thing?: { url?: string | null } | null } | null 
          }
          objectUrl = objectWithValue?.value?.thing?.url || ''
        }
        
        amount = (parseFloat(event.redemption.assets || '0') / 1e18).toFixed(4)
        amountLabel = 'TRUST'
      }

      if (accountLabel && accountWallet) {
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
          objectUrl,
          amount,
          amountLabel
        })
      }
    }

    console.log('📊 Total feed events:', feedEvents.length)
    setFeedItems(feedEvents)
  }, [eventsData, walletToLabel])

  const loading = trustCircleLoading || eventsLoading
  const error = (trustCircleError ? String(trustCircleError) : null) || (eventsError ? String(eventsError) : null)

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

    // Extract vaultId from portalLink
    let vaultId = ''
    if (item.type === 'AtomCreated' || item.portalLink?.includes('/atom/')) {
      const match = item.portalLink?.match(/\/atom\/(.+)$/)
      vaultId = match ? match[1] : ''
    } else if (item.type === 'TripleCreated' || item.portalLink?.includes('/triple/')) {
      const match = item.portalLink?.match(/\/triple\/(.+)$/)
      vaultId = match ? match[1] : ''
    }

    setSelectedEvent(item)
    setSelectedVaultId(vaultId)
    setIsUpvoteModalOpen(true)
  }

  const handleDeclineClick = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setDeclinedEvents((prev) => [...(prev || []), itemId])
  }

  const handleCloseModal = () => {
    setIsUpvoteModalOpen(false)
    setSelectedEvent(null)
    setSelectedVaultId('')
    setIsProcessing(false)
    setShouldRefreshOnClose(false)
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
          <button onClick={() => window.location.reload()} className="retry-button">
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
                <div key={item.id} className="feed-item-wrapper">
                  <div className="feed-item-header">
                    <Avatar
                      imgSrc={item.accountImage}
                      name={item.accountWallet}
                      avatarClassName="feed-avatar"
                      size="medium"
                    />
                    <div className="feed-header-text">
                      <span className="feed-account-name">{item.accountLabel}</span>
                      {' '}
                      <span className="feed-action">{item.description} :</span>
                    </div>
                  </div>
                  <div className="feed-item-container">
                  <div className="feed-content">
                    <div className="feed-text">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ flex: 1 }}>
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
                        {item.objectUrl && (
                          <a 
                            href={item.objectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="feed-link-button"
                          >
                            🔗
                          </a>
                        )}
                      </div>
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
                </div>
              )
            })}
            <br />
        </div>
      ) : (
        <div className="empty-state">
          <p>No activity yet</p>
          <p className="empty-subtext">
            Accounts in your Trust Circle haven't had any activity yet.
          </p>
        </div>
      )}

      <StakeModal
        isOpen={isUpvoteModalOpen}
        onClose={handleCloseModal}
        onSubmit={async (amount: bigint, curveId: 1 | 2) => {
          if (!selectedEvent) {
            return { success: false, error: 'No event selected' }
          }

          if (!selectedVaultId) {
            return { success: false, error: 'No vault ID found for this event' }
          }

          try {
            setIsProcessing(true)

            console.log('💰 FeedTab - Deposit calculation:', {
              amount: amount.toString(),
              depositInTRUST: (Number(amount) / 1e18).toFixed(4),
              curveId
            })

            const result = await addWeight(selectedVaultId, amount, BigInt(curveId))
            console.log('📊 FeedTab - addWeight result:', result)

            if (result.success) {
              console.log('✅ FeedTab - Transaction successful, txHash:', result.txHash)
              // Don't refresh here - will refresh when modal closes to avoid re-render
              setShouldRefreshOnClose(true)

              setIsProcessing(false)
              return { success: true, txHash: result.txHash }
            } else {
              setIsProcessing(false)
              return { success: false, error: result.error || 'Transaction failed' }
            }
          } catch (error) {
            console.error('❌ FeedTab - Transaction error:', error)
            setIsProcessing(false)
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Transaction failed'
            }
          }
        }}
        subjectName="Feed"
        predicateName={selectedEvent?.type === 'AtomCreated' ? 'created' : 'supports'}
        objectName={selectedEvent ? selectedEvent.details : ''}
        tripleId={selectedVaultId}
        defaultCurve={1}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default FeedTab
