import { useState, useEffect } from 'react'
import { useWalletFromStorage } from '../../../hooks/useWalletFromStorage'
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../../../types/intuition'
import { getAddress } from 'viem'
import BookmarkButton from '../../ui/BookmarkButton'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import { useGetAtomAccount, AccountAtom } from '../../../hooks/useGetAtomAccount'
import FollowButton from '../../ui/FollowButton'
import TrustAccountButton from '../../ui/TrustAccountButton'
import StakeModal from '../../modals/StakeModal'
import { useWeightOnChain } from '../../../hooks/useWeightOnChain'
import Avatar from '../../ui/Avatar'
import AccountStats from '../../ui/AccountStats'
import { batchGetEnsAvatars } from '../../../lib/utils/ensUtils'
import UserAtomStats from '../../ui/UserAtomStats'
import { useRouter } from '../../layout/RouterProvider'
import '../../styles/CoreComponents.css'
import '../../styles/FollowTab.css'

// Removed - using viem getAddress instead

interface FollowedAccount {
  id: string
  label: string
  termId: string
  tripleId: string
  followDate: string
  image?: string
  url?: string
  description?: string
  walletInfo?: { wallet: string; shares: string }[]
  trustAmount: number
  walletAddress?: string // Wallet address for stats lookup
}

const FollowTab = () => {
  const { walletAddress: address } = useWalletFromStorage()
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'followers' | 'following' | 'trust-circle'>('followers')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'highest-stake' | 'lowest-stake' | 'recent'>('highest-stake')

  // Router for navigation
  const { navigateTo, searchContext, setSearchContext } = useRouter()

  // Search functionality
  const { searchAccounts } = useGetAtomAccount()
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Restore search context when coming back from user profile
  useEffect(() => {
    if (searchContext) {
      setSearchQuery(searchContext.query)
      setShowSearchResults(searchContext.showResults)

      // Re-trigger search with the restored query
      if (searchContext.query.trim()) {
        searchAccounts(searchContext.query).then(results => {
          setSearchResults(results)
        })
      }

      // Clear the context after restoring
      setSearchContext(null)
    }
  }, [searchContext, setSearchContext, searchAccounts])

  // Upvote modal state for Trust Circle
  const [selectedAccount, setSelectedAccount] = useState<FollowedAccount | null>(null)
  const [isUpvoteModalOpen, setIsUpvoteModalOpen] = useState(false)
  const [isProcessingUpvote, setIsProcessingUpvote] = useState(false)
  const { addWeight, removeWeight } = useWeightOnChain()


  // Filter and sort accounts
  const getFilteredAccounts = () => {
    let filtered = followedAccounts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(account =>
        account.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'highest-stake') {
        return b.trustAmount - a.trustAmount
      } else if (sortBy === 'lowest-stake') {
        return a.trustAmount - b.trustAmount
      } else {
        // recent
        return new Date(b.followDate).getTime() - new Date(a.followDate).getTime()
      }
    })

    return sorted
  }

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    loadFollows()
  }, [address, filterType])

  // Handle search input changes - auto-search as user types
  useEffect(() => {
    const performAutoSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchAccounts(searchQuery)
        setSearchResults(results)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }

    performAutoSearch()
  }, [searchQuery, searchAccounts])

  // Handle follow success callback
  const handleFollowSuccess = () => {
    console.log('✅ FollowTab - Follow successful, refreshing list')

    // Rafraîchir immédiatement
    loadFollows()

    // Rafraîchir après 2 secondes (le temps que l'API indexe)
    setTimeout(() => {
      console.log('🔄 FollowTab - Second refresh after indexing delay')
      loadFollows()
    }, 2000)

    // Rafraîchir après 5 secondes au cas où
    setTimeout(() => {
      console.log('🔄 FollowTab - Third refresh after extended delay')
      loadFollows()
    }, 5000)
  }

  // Handle navigation to user profile
  const handleNavigateToUserProfile = (account: FollowedAccount) => {
    // Save search context before navigating
    if (searchQuery || showSearchResults) {
      setSearchContext({
        query: searchQuery,
        showResults: showSearchResults
      })
    }

    navigateTo('user-profile', {
      termId: account.termId,
      label: account.label,
      image: account.image,
      walletAddress: account.walletAddress,
      url: account.url,
      description: account.description
    })
  }

  // Handle navigation to search result profile
  const handleNavigateToSearchResult = (account: AccountAtom) => {
    // Save search context before navigating
    setSearchContext({
      query: searchQuery,
      showResults: showSearchResults
    })

    navigateTo('user-profile', {
      termId: account.id,
      label: account.label,
      image: account.image,
      walletAddress: account.data,
      url: undefined,
      description: undefined
    })
  }

  // Handle upvote click for Trust Circle
  const handleUpvoteClick = (account: FollowedAccount) => {
    setSelectedAccount(account)
    setIsUpvoteModalOpen(true)
  }

  const handleCloseUpvoteModal = () => {
    setIsUpvoteModalOpen(false)
    setSelectedAccount(null)
    setIsProcessingUpvote(false)
  }

  const handleUpvoteSubmit = async (newUpvotes: number) => {
    if (!selectedAccount || !address) return

    try {
      setIsProcessingUpvote(true)

      const currentUpvotes = Math.round(selectedAccount.trustAmount * 1000) // Convert TRUST to upvotes
      const difference = newUpvotes - currentUpvotes

      console.log('Adjusting upvotes from', currentUpvotes, 'to', newUpvotes, 'difference:', difference)

      if (difference === 0) {
        handleCloseUpvoteModal()
        return
      }

      // Convert upvotes to Wei (1 upvote = 0.001 TRUST = 10^15 Wei)
      const weightChange = BigInt(Math.abs(difference)) * BigInt(1e15)

      let result
      if (difference > 0) {
        // Adding upvotes
        result = await addWeight(selectedAccount.tripleId, weightChange)
      } else {
        // Removing upvotes
        result = await removeWeight(selectedAccount.tripleId, weightChange)
      }

      if (result.success) {
        console.log('✅ Weight adjustment successful:', result.txHash)

        // Refresh the data after successful transaction
        await loadFollows()

        handleCloseUpvoteModal()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Failed to adjust upvotes:', error)
      setIsProcessingUpvote(false)
      // Keep modal open to show error or allow retry
    }
  }

  const loadFollows = async () => {
    try {
      console.log('🔍 FollowTab - Loading', filterType, {
        userAddress: address
      })

      setLoading(true)
      setError(null)

      if (!address) {
        console.log('❌ No account, returning empty array')
        setFollowedAccounts([])
        return
      }

      // Utiliser viem pour convertir l'adresse au format checksum EIP-55
      const checksumAddress = getAddress(address)
      console.log('🔄 Original address:', address)
      console.log('🔄 Checksum address:', checksumAddress)

      let response: GraphQLTriplesResponse

      if (filterType === 'following' || filterType === 'trust-circle') {
        // FOLLOWING or TRUST CIRCLE: Query triples where I have a position
        // Use same structure as task.md
        // IMPORTANT:
        // - Following uses curve_id = 1 only
        // - Trust Circle uses ALL curves (1 and 2) because:
        //   - Curve 1 = initial creation deposit (0.01 TRUST)
        //   - Curve 2 = additional deposits

        let triplesQuery: string

        if (filterType === 'trust-circle') {
          // For trust-circle, get positions from ALL curves (no filter on curve_id)
          triplesQuery = `
            query Triples($where: triples_bool_exp, $walletAddress: String!) {
              triples(where: $where) {
                subject { label, term_id, type }
                predicate { label, term_id }
                object { label, term_id, type, image, data }
                term_id
                created_at
                term {
                  vaults(order_by: {curve_id: asc}) {
                    positions(where: {account_id: {_eq: $walletAddress}}) {
                      account_id
                      shares
                      created_at
                    }
                  }
                }
              }
            }
          `
        } else {
          // For following, only get positions from curve_id = 1
          triplesQuery = `
            query Triples($where: triples_bool_exp, $walletAddress: String!) {
              triples(where: $where) {
                subject { label, term_id, type }
                predicate { label, term_id }
                object { label, term_id, type, image, data }
                term_id
                created_at
                term {
                  vaults(where: {curve_id: {_eq: "1"}}, order_by: {curve_id: asc}) {
                    positions(where: {account_id: {_eq: $walletAddress}}) {
                      account_id
                      shares
                      created_at
                    }
                  }
                }
              }
            }
          `
        }

        // Use TRUSTS or FOLLOW predicate depending on filter type
        const predicateId = filterType === 'trust-circle' ? PREDICATE_IDS.TRUSTS : PREDICATE_IDS.FOLLOW

        const where = {
          "_and": [
            {
              "subject_id": {
                "_eq": SUBJECT_IDS.I
              }
            },
            {
              "predicate_id": {
                "_eq": predicateId
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

        console.log(`🚀 Making GraphQL request (${filterType}) with where:`, where)

        response = await intuitionGraphqlClient.request(triplesQuery, {
          where,
          walletAddress: checksumAddress
        }) as GraphQLTriplesResponse

      } else {
        // FOLLOWERS: Find the Account atom for my wallet address,
        // then find positions on the triple "I -> follow -> MY_ACCOUNT_ATOM"

        const myAccountAtomQuery = `
          query GetMyAccountAtom($address: String!) {
            atoms(where: {
              _and: [
                { data: { _ilike: $address } },
                { type: { _eq: "Account" } }
              ]
            }, limit: 1) {
              term_id
              label
              data
              type
            }
          }
        `

        // Convert to lowercase for matching with 'data' field
        const lowercaseAddress = checksumAddress.toLowerCase()

        const myAccountResponse = await intuitionGraphqlClient.request(myAccountAtomQuery, {
          address: `%${lowercaseAddress}%`
        }) as { atoms: Array<{ term_id: string; label: string; data: string; type: string }> }

        let myAccountAtomId = null
        if (myAccountResponse.atoms && myAccountResponse.atoms.length > 0) {
          myAccountAtomId = myAccountResponse.atoms[0].term_id
          console.log('✅ Found my Account atom:', myAccountAtomId, 'Label:', myAccountResponse.atoms[0].label, 'Data:', myAccountResponse.atoms[0].data)
        } else {
          console.log('⚠️ No Account atom found for wallet:', lowercaseAddress)
          setFollowedAccounts([])
          setLoading(false)
          return
        }

        // Query the triple: I -> FOLLOW -> MY_ACCOUNT_ATOM_ID and get all positions on it
        const followersQuery = `
          query GetFollowersPositions($subjectId: String!, $predicateId: String!, $objectId: String!) {
            triples(
              where: {
                _and: [
                  { subject_id: { _eq: $subjectId } },
                  { predicate_id: { _eq: $predicateId } },
                  { object_id: { _eq: $objectId } }
                ]
              }
            ) {
              term_id
              subject { label, term_id, type }
              predicate { label, term_id }
              object { label, term_id, type }
              created_at
              term {
                vaults(where: { curve_id: { _eq: "1" } }) {
                  total_shares
                  positions {
                    account {
                      id
                      label
                      image
                      atom_id
                      atom {
                        term_id
                        label
                        data
                        type
                        image
                      }
                    }
                    shares
                  }
                }
              }
            }
          }
        `

        console.log('🚀 Query followers: I ->', PREDICATE_IDS.FOLLOW, '-> my Account atom:', myAccountAtomId)

        response = await intuitionGraphqlClient.request(followersQuery, {
          subjectId: SUBJECT_IDS.I,
          predicateId: PREDICATE_IDS.FOLLOW,
          objectId: myAccountAtomId
        }) as GraphQLTriplesResponse
      }
      
      console.log('📥 GraphQL response:', response)
      
      if (!response?.triples) {
        console.log('❌ No triples in response')
        setFollowedAccounts([])
        return
      }
      
      console.log('✅ Found follow triples:', response.triples.length)

      // Extract unique labels to fetch their IPFS data
      // For following: get object labels (accounts I follow)
      // For followers: get subject labels (accounts that follow me)
      const accountLabels = [...new Set(response.triples.map(triple =>
        filterType === 'following' ? triple.object.label : triple.subject.label
      ))]
      
      // Fetch IPFS hashes for objects
      const atomsQuery = `
        query GetAtomsByLabels($labels: [String!]!) {
          atoms(where: {
            label: { _in: $labels }
          }) {
            label
            data
          }
        }
      `
      
      const atomsResponse = await intuitionGraphqlClient.request(atomsQuery, {
        labels: accountLabels
      }) as { atoms: Array<{ label: string; data?: string }> }
      
      // Create a map for quick lookup and fetch IPFS data
      const atomDataMap = new Map<string, { url?: string; description?: string }>()
      
      for (const atom of atomsResponse.atoms) {
        if (atom.data && atom.data.startsWith('ipfs://')) {
          try {
            // Convert IPFS hash to HTTP gateway URL
            const ipfsHash = atom.data.replace('ipfs://', '')
            const ipfsGatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`
            
            // Fetch data from IPFS
            const ipfsResponse = await fetch(ipfsGatewayUrl)
            if (ipfsResponse.ok) {
              const ipfsData = await ipfsResponse.json()
              atomDataMap.set(atom.label, {
                url: ipfsData.url,
                description: ipfsData.description
              })
            }
          } catch (e) {
            console.warn('Failed to fetch IPFS data for:', atom.data)
          }
        }
      }

      // Convert triples to display format
      let accounts: FollowedAccount[] = []

      if (filterType === 'following' || filterType === 'trust-circle') {
        // Following or Trust Circle: Each triple represents one account I follow/trust
        // Filter client-side: only show triples where user has positions
        accounts = response.triples
          .filter((triple: any) => {
            // Check if user has positions in ANY vault (curve)
            const vaults = triple.term?.vaults || []
            return vaults.some((vault: any) => vault.positions && vault.positions.length > 0)
          })
          .map((triple: any) => {
            const account = triple.object
            const accountData = atomDataMap.get(account.label)

            // Calculate trust amount from my positions across ALL vaults (curves)
            const vaults = triple.term?.vaults || []
            const trustAmountWei = vaults.reduce((vaultSum: number, vault: any) => {
              const positions = vault?.positions || []
              const vaultPositionsSum = positions.reduce((posSum: number, pos: any) => {
                return posSum + parseFloat(pos.shares || '0')
              }, 0)
              return vaultSum + vaultPositionsSum
            }, 0)

            const trustAmount = trustAmountWei / 1e18

          // Extract wallet address from data field or use label if it's an address
          let walletAddress: string | undefined = undefined
          if (account.data) {
            // If data starts with 0x, it's a wallet address
            if (typeof account.data === 'string' && account.data.startsWith('0x')) {
              walletAddress = account.data
            }
          } else if (account.label?.startsWith('0x')) {
            // Label might be the wallet address
            walletAddress = account.label
          }

          return {
            id: triple.term_id,
            label: account.label || 'Unknown',
            termId: account.term_id,
            tripleId: triple.term_id,
            followDate: new Date(triple.created_at).toLocaleDateString(),
            image: account.image,
            url: accountData?.url,
            description: accountData?.description,
            walletInfo: [],
            trustAmount,
            walletAddress
          }
        })
      } else {
        // Followers: Get all positions on the triple "I follow [my wallet]"
        // Each position represents one follower
        const triple: any = response.triples[0]
        if (response.triples.length > 0 && triple?.term?.vaults?.length > 0) {
          const vault = triple.term.vaults[0]

          accounts = vault.positions?.map((position: any) => {
            const trustAmountWei = parseFloat(position.shares || '0')
            const trustAmount = trustAmountWei / 1e18

            // Extract wallet address and atom info
            const accountAtom = position.account.atom
            let walletAddress: string | undefined = undefined
            let atomTermId: string | undefined = undefined
            let displayLabel: string = position.account.label || position.account.id
            let displayImage: string | undefined = position.account.image

            // Prioritize atom data if available (more complete info)
            if (accountAtom) {
              atomTermId = accountAtom.term_id
              if (accountAtom.data && typeof accountAtom.data === 'string' && accountAtom.data.startsWith('0x')) {
                walletAddress = accountAtom.data
              }
              // Use atom label and image if available
              if (accountAtom.label) displayLabel = accountAtom.label
              if (accountAtom.image) displayImage = accountAtom.image
            }

            // Fallback to account.id if it's a wallet address
            if (!walletAddress && position.account.id?.startsWith('0x')) {
              walletAddress = position.account.id
            }

            // Use atom term_id, or fallback to account.id
            const finalTermId = atomTermId || position.account.id

            return {
              id: position.account.id,
              label: displayLabel,
              termId: finalTermId,
              tripleId: triple.term_id,
              followDate: new Date(triple.created_at).toLocaleDateString(),
              image: displayImage,
              url: undefined,
              description: undefined,
              walletInfo: [],
              trustAmount,
              walletAddress
            }
          }) || []
        }
      }

      // Fetch ENS avatars for accounts that don't have images from Intuition
      console.log('🔍 Fetching ENS avatars for accounts without images...')
      const ensAvatars = await batchGetEnsAvatars(
        accounts.map(acc => ({ label: acc.label, image: acc.image }))
      )

      // Update accounts with ENS avatars
      if (ensAvatars.size > 0) {
        accounts = accounts.map(acc => ({
          ...acc,
          image: acc.image || ensAvatars.get(acc.label) || undefined
        }))
        console.log('✅ Fetched ENS avatars:', ensAvatars.size)
      }

      setFollowedAccounts(accounts)
      console.log('✅ FollowTab - Follow relationships loaded', {
        accountCount: accounts.length,
        accounts
      })

    } catch (error) {
      console.error('❌ FollowTab - Failed to load follows', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (account: FollowedAccount) => {
    console.log('🔄 FollowTab - Unfollow requested', { account })
    // TODO: Implement unfollow logic
    // For now, just remove from local state
    setFollowedAccounts(prev => prev.filter(a => a.id !== account.id))
  }

  if (!address) {
    return (
      <div className="follow-tab">
        <div className="empty-state">
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view your follows.</p>
        </div>
      </div>
    )
  }

  const filteredAccounts = getFilteredAccounts()

  return (
    <div className="follow-tab">
      {/* Filter buttons */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filterType === 'followers' ? 'active' : ''}`}
          onClick={() => setFilterType('followers')}
        >
          Followers
        </button>
        <button
          className={`filter-btn ${filterType === 'following' ? 'active' : ''}`}
          onClick={() => setFilterType('following')}
        >
          Following
        </button>
        <button
          className={`filter-btn ${filterType === 'trust-circle' ? 'active' : ''}`}
          onClick={() => setFilterType('trust-circle')}
        >
          Trust Circle
        </button>
      </div>

      {/* Search and Sort */}
      <div className="search-container">
        <div className="search-sort-container">
          <input
            type="text"
            className="input"
            placeholder="Search all accounts on Intuition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.slice(0, 10).map((account, index) => (
              <div
                key={account.id}
                className="search-result-card"
                onClick={() => handleNavigateToSearchResult(account)}
              >
                <div className="account-left">
                  <span className="account-number">{index + 1}</span>
                  <Avatar
                    imgSrc={account.image}
                    name={account.label}
                    avatarClassName="account-avatar"
                    size="medium"
                  />
                  <div className="search-account-info">
                    <span className="account-label">{account.label}</span>
                    <UserAtomStats termId={account.id} accountAddress={account.data} compact={true} />
                  </div>
                </div>
                <div className="account-right" onClick={(e) => e.stopPropagation()}>
                  <FollowButton
                    account={account}
                    onFollowSuccess={handleFollowSuccess}
                  />
                </div>
              </div>
            ))}

            {searchResults.length > 10 && (
              <div className="search-results-more">
                +{searchResults.length - 10} more results
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-state">
          <p>Loading your follows...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="error-state">
          <h3>Error Loading Follows</h3>
          <p>{error}</p>
          <button onClick={loadFollows} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Accounts list */}
      {!loading && !error && (
        <div className="followed-accounts">
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              className="followed-account-card"
              onClick={() => handleNavigateToUserProfile(account)}
              style={{ cursor: 'pointer' }}
            >
              <div className="account-left">
                <span className="account-number">{index + 1}</span>
                <Avatar
                  imgSrc={account.image}
                  name={account.label}
                  avatarClassName="account-avatar"
                  size="medium"
                />
                <div className="account-info">
                  <span className="account-label">{account.label}</span>
                  <UserAtomStats termId={account.termId} accountAddress={account.walletAddress} compact={true} />
                  <span className="trust-amount">{account.trustAmount.toFixed(8)} TRUST</span>
                </div>
              </div>
              <div className="account-right" onClick={(e) => e.stopPropagation()}>
                {filterType === 'following' && (
                  <TrustAccountButton
                    accountVaultId={account.termId}
                    accountLabel={account.label}
                    onSuccess={() => {
                      console.log('✅ Trust created for', account.label)

                      // Rafraîchir immédiatement
                      loadFollows()

                      // Rafraîchir après 2 secondes (le temps que l'API indexe)
                      setTimeout(() => {
                        console.log('🔄 FollowTab - Refresh after trust indexing delay')
                        loadFollows()
                      }, 2000)

                      // Rafraîchir après 5 secondes au cas où
                      setTimeout(() => {
                        console.log('🔄 FollowTab - Second refresh after trust')
                        loadFollows()
                      }, 5000)

                      // Rafraîchir après 10 secondes (indexation plus longue pour positions)
                      setTimeout(() => {
                        console.log('🔄 FollowTab - Final refresh after trust')
                        loadFollows()
                      }, 10000)
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stake Modal for Trust Circle */}
      {selectedAccount && (
        <StakeModal
          isOpen={isUpvoteModalOpen}
          subjectName="I"
          predicateName="trust"
          objectName={selectedAccount.label}
          tripleId={selectedAccount.tripleId}
          defaultCurve={1}
          onClose={handleCloseUpvoteModal}
          onSubmit={async (amount: bigint, curveId: 1 | 2) => {
            // Convert bigint Wei to number TRUST
            const trustAmount = Number(amount) / 1e18
            const newUpvotes = Math.round(trustAmount * 1000)
            await handleUpvoteSubmit(newUpvotes)
          }}
          isProcessing={isProcessingUpvote}
        />
      )}
    </div>
  )
}

export default FollowTab