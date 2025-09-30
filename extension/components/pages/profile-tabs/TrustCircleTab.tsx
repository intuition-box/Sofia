import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/TrustCircleTab.css'

interface FollowedAccount {
  id: string
  label: string
  termId: string
  tripleId: string
  followDate: string
  trustAmount: string
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

      // Query to get triplets created by user, filtered by follow predicate and my positions
      const combinedQuery = `
        query GetMyTriples($walletAddress: String!) {
          triples(
            where: {
              _and: [
                { subject: { term_id: { _eq: "0x8d61ecf6e15472e15b1a0f63cd77f62aa57e6edcd3871d7a841f1056fb42b216" } } },
                { predicate: { term_id: { _eq: "0x8f9b5dc2e7b8bd12f6762c839830672f1d13c08e72b5f09f194cafc153f2df8a" } } },
                { positions: { account_id: { _eq: $walletAddress }, shares: { _gt: "0" } } }
              ]
            },
            order_by: { created_at: desc }
          ) {
            subject { label, term_id }
            predicate { label, term_id }
            object { label, term_id }
            term_id
            created_at
            transaction_hash
            positions(where: { account_id: { _eq: $walletAddress }, shares: { _gt: "0" } }) {
              account_id
              shares
            }
          }
        }
      `

      const response = await fetch('https://testnet.intuition.sh/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: combinedQuery,
          variables: {
            walletAddress: address.toLowerCase()
          }
        })
      })

      const result = await response.json()

      console.log('✅ TrustCircleTab - GraphQL response', {
        triples: result.data?.triples || [],
        triplesFound: result.data?.triples?.length || 0,
        errors: result.errors
      })

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL query failed')
      }

      const triples = result.data?.triples || []
      console.log('✅ TrustCircleTab - Follow triples found:', {
        totalTriples: triples.length,
        triples: triples.map(triple => ({
          termId: triple.term_id,
          subject: triple.subject.label,
          predicate: triple.predicate.label,
          object: triple.object.label,
          createdAt: triple.created_at
        }))
      })

      // Convert triples to display format
      const accounts: FollowedAccount[] = triples.map(triple => ({
        id: triple.term_id,
        label: triple.object.label,
        termId: triple.object.term_id,
        tripleId: triple.term_id,
        followDate: new Date(triple.created_at).toLocaleDateString(),
        trustAmount: "Follow",
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
                  <span className="trust-amount">TRUST: {account.trustAmount}</span>
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