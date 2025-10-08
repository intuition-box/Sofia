import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../../../types/intuition'
import { getAddress } from 'viem'
import BookmarkButton from '../../ui/BookmarkButton'
import '../../styles/CoreComponents.css'
import '../../styles/TrustCircleTab.css'

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
}

const TrustCircleTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAccount, setExpandedAccount] = useState<{ accountId: string } | null>(null)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    loadTrustCircle()
  }, [address])

  const loadTrustCircle = async () => {
    try {
      console.log('🔍 TrustCircleTab - Loading trust circle', {
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

      const triplesQuery = `
        query Triples($where: triples_bool_exp, $walletAddress: String!) {
          triples(where: $where) {
            subject { label, term_id }
            predicate { label, term_id }
            object { label, term_id }
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
            "subject": {
              "term_id": {
                "_eq": SUBJECT_IDS.I
              }
            }
          },
          {
            "predicate": {
              "term_id": {
                "_eq": PREDICATE_IDS.FOLLOW
              }
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
      
      console.log('🚀 Making GraphQL request with where:', where)
      
      const response = await intuitionGraphqlClient.request(triplesQuery, {
        where,
        walletAddress: checksumAddress
      }) as GraphQLTriplesResponse
      
      console.log('📥 GraphQL response:', response)
      
      if (!response?.triples) {
        console.log('❌ No triples in response')
        setFollowedAccounts([])
        return
      }
      
      console.log('✅ Found follow triples:', response.triples.length)

      // Extract unique object labels to fetch their IPFS data
      const objectLabels = [...new Set(response.triples.map(triple => triple.object.label))]
      
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
        labels: objectLabels
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
      const accounts: FollowedAccount[] = response.triples.map((triple: IntuitionTripleResponse) => {
        const objectData = atomDataMap.get(triple.object.label)
        
        return {
          id: triple.term_id,
          label: triple.object.label || 'Unknown',
          termId: triple.object.term_id,
          tripleId: triple.term_id,
          followDate: new Date(triple.created_at).toLocaleDateString(),
          url: objectData?.url,
          description: objectData?.description,
          walletInfo: []
        }
      })

      setFollowedAccounts(accounts)
      console.log('✅ TrustCircleTab - Follow relationships loaded', {
        accountCount: accounts.length,
        accounts
      })

    } catch (error) {
      console.error('❌ TrustCircleTab - Failed to load trust circle', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (account: FollowedAccount) => {
    console.log('🔄 TrustCircleTab - Unfollow requested', { account })
    // TODO: Implement unfollow logic
    // For now, just remove from local state
    setFollowedAccounts(prev => prev.filter(a => a.id !== account.id))
  }

  if (!address) {
    return (
      <div className="trust-circle-tab">
        <div className="empty-state">
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to view your trust circle.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="trust-circle-tab">
        <div className="loading-state">
          <p>Loading your trust circle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="trust-circle-tab">
        <div className="error-state">
          <h3>Error Loading Trust Circle</h3>
          <p>{error}</p>
          <button onClick={loadTrustCircle} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="trust-circle-tab">
      <div className="trust-circle-header">
        <h2>Your Trust Circle</h2>
        <p>Accounts you follow</p>
        <div className="stats">
          <span className="stat">
            <strong>{followedAccounts.length}</strong> following
          </span>
        </div>
      </div>

      {followedAccounts.length === 0 ? (
        <div className="empty-state">
          <h3>No Follow Relationships Yet</h3>
          <p>You haven't followed anyone yet. Start following accounts to build your trust circle.</p>
        </div>
      ) : (
        <div className="followed-accounts">
          {followedAccounts.map(account => {
            const isExpanded = expandedAccount?.accountId === account.id
            
            return (
              <div key={account.id} className="followed-account-card">
                <div className="account-info">
                  <div 
                    className="account-label clickable" 
                    onClick={() => {
                      setExpandedAccount(isExpanded ? null : { accountId: account.id })
                    }}
                  >
                    {account.label}
                  </div>
                  <div className="account-details">
                    <span className="follow-date">Followed on {account.followDate}</span>
                    {account.description && (
                      <span className="account-description">{account.description}</span>
                    )}
                  </div>
                  
                  {/* Section expanded */}
                  {isExpanded && (
                    <div className="triplet-detail-actions">
                      <button
                        onClick={() => window.open(`https://portal.intuition.systems/explore/atom/${account.termId}?tab=overview`, '_blank')}
                        className="portal-button"
                        title="View on Intuition Portal"
                      >
                        🌐 Portal
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement bookmark functionality
                          console.log('Bookmark clicked for:', account.label)
                        }}
                        className="portal-button"
                        title="Add to bookmarks"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TrustCircleTab