import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../../../types/intuition'
import { getAddress } from 'viem'
import BookmarkButton from '../../ui/BookmarkButton'
import searchIcon from '../../ui/icons/Icon=Search.svg'
import { useGetAtomAccount, AccountAtom } from '../../../hooks/useGetAtomAccount'
import FollowButton from '../../ui/FollowButton'
import TrustAccountButton from '../../ui/TrustAccountButton'
import '../../styles/CoreComponents.css'
import '../../styles/FollowTab.css'

// Removed - using viem getAddress instead

interface FollowedAccount {
  id: string
  label: string
  termId: string
  tripleId: string
  followDate: string
  url?: string
  description?: string
  walletInfo?: { wallet: string; shares: string }[]
  trustAmount: number
}

const FollowTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'followers' | 'following'>('followers')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'highest-stake' | 'lowest-stake' | 'recent'>('highest-stake')

  // Search functionality
  const { searchAccounts } = useGetAtomAccount()
  const [searchResults, setSearchResults] = useState<AccountAtom[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Generate avatar color from label
  const getAvatarColor = (label: string) => {
    const colors = [
      '#10b981', // green
      '#3b82f6', // blue
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
    ]
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

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
    loadFollows()
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

      if (filterType === 'following') {
        // FOLLOWING: Keep the original working query
        const triplesQuery = `
          query Triples($where: triples_bool_exp, $walletAddress: String!) {
            triples(where: $where) {
              subject { label, term_id, type }
              predicate { label, term_id }
              object { label, term_id, type }
              term_id
              created_at
              positions(where: { account: { id: { _eq: $walletAddress } } }) {
                account { id }
                shares
                created_at
                curve_id
              }
            }
          }
        `

        const where = {
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
                "_eq": PREDICATE_IDS.FOLLOW
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

        console.log('🚀 Making GraphQL request (following) with where:', where)

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

      if (filterType === 'following') {
        // Following: Each triple represents one account I follow
        accounts = response.triples.map((triple: any) => {
          const account = triple.object
          const accountData = atomDataMap.get(account.label)

          // Calculate trust amount from my positions on this triple
          const trustAmountWei = triple.positions?.reduce((sum: number, pos: any) => {
            return sum + parseFloat(pos.shares || '0')
          }, 0) || 0

          const trustAmount = trustAmountWei / 1e18

          return {
            id: triple.term_id,
            label: account.label || 'Unknown',
            termId: account.term_id,
            tripleId: triple.term_id,
            followDate: new Date(triple.created_at).toLocaleDateString(),
            url: accountData?.url,
            description: accountData?.description,
            walletInfo: [],
            trustAmount
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

            return {
              id: position.account.id,
              label: position.account.label || position.account.id,
              termId: position.account.id,
              tripleId: triple.term_id,
              followDate: new Date(triple.created_at).toLocaleDateString(),
              url: undefined,
              description: undefined,
              walletInfo: [],
              trustAmount
            }
          }) || []
        }
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
              >
                <div className="account-left">
                  <span className="account-number">{index + 1}</span>
                  <div
                    className="account-avatar"
                    style={{ backgroundColor: getAvatarColor(account.label) }}
                  >
                    {account.label.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="account-label">{account.label}</span>
                </div>
                <div className="account-right">
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
            <div key={account.id} className="followed-account-card">
              <div className="account-left">
                <span className="account-number">{index + 1}</span>
                <div
                  className="account-avatar"
                  style={{ backgroundColor: getAvatarColor(account.label) }}
                >
                  {account.label.slice(0, 2).toUpperCase()}
                </div>
                <span className="account-label">{account.label}</span>
              </div>
              <div className="account-right">
                <span className="trust-amount">{account.trustAmount.toFixed(8)} TRUST</span>
                {filterType === 'following' && (
                  <TrustAccountButton
                    accountVaultId={account.termId}
                    accountLabel={account.label}
                    onSuccess={() => console.log('✅ Trust created for', account.label)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowTab