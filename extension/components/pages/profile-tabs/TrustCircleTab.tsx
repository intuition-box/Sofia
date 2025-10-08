import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { intuitionGraphqlClient } from '../../../lib/clients/graphql-client'
import { SUBJECT_IDS, PREDICATE_IDS } from '../../../lib/config/constants'
import type { GraphQLTriplesResponse, IntuitionTripleResponse } from '../../../types/intuition'
import '../../styles/TrustCircleTab.css'

// Convert address to checksum format (same as useIntuitionTriplets)
const toChecksumAddress = (address: string): string => {
  if (!address) return address
  
  // Remove 0x prefix and convert to lowercase
  const addr = address.toLowerCase().replace('0x', '')
  
  // Simple checksum implementation
  let checksumAddr = '0x'
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(addr[i], 16) >= 8) {
      checksumAddr += addr[i].toUpperCase()
    } else {
      checksumAddr += addr[i]
    }
  }
  
  return checksumAddr
}

interface FollowedAccount {
  id: string
  label: string
  termId: string
  tripleId: string
  followDate: string
  walletInfo?: { wallet: string; shares: string }[]
}

const TrustCircleTab = () => {
  const [address] = useStorage<string>("metamask-account")
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                  "_eq": toChecksumAddress(address)
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
        walletAddress: toChecksumAddress(address)
      }) as GraphQLTriplesResponse
      
      console.log('📥 GraphQL response:', response)
      
      if (!response?.triples) {
        console.log('❌ No triples in response')
        setFollowedAccounts([])
        return
      }
      
      console.log('✅ Found follow triples:', response.triples.length)

      // Convert triples to display format
      const accounts: FollowedAccount[] = response.triples.map((triple: IntuitionTripleResponse) => ({
        id: triple.term_id,
        label: triple.object.label || 'Unknown',
        termId: triple.object.term_id,
        tripleId: triple.term_id,
        followDate: new Date(triple.created_at).toLocaleDateString(),
        walletInfo: []
      }))

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
          {followedAccounts.map(account => (
            <div key={account.id} className="followed-account-card">
              <div className="account-info">
                <div className="account-label">{account.label}</div>
                <div className="account-details">
                  <span className="follow-date">Followed on {account.followDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrustCircleTab