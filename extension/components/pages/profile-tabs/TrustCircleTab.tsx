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
      console.log('🔍 TrustCircleTab - Loading trust circle', { userAddress: address })
      setLoading(true)
      setError(null)

      // Query GraphQL API pour récupérer tous les triples où l'utilisateur suit quelqu'un
      const query = `
        query GetTrustCircle($userAddress: String!) {
          atoms(
            where: {
              type: { _eq: "Thing" }
            }
          ) {
            term_id
            label
            as_subject_triples(
              where: {
                predicate: { label: { _eq: "follow" } },
                creator_id: { _eq: $userAddress }
              }
            ) {
              term_id
              created_at
              transaction_hash
              creator_id
              subject { label, term_id }
              predicate { label, term_id }
              object { label, term_id }
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
          query,
          variables: {
            userAddress: address
          }
        })
      })

      const result = await response.json()

      console.log('✅ TrustCircleTab - GraphQL response', {
        atomsFound: result.data?.atoms?.length || 0,
        atoms: result.data?.atoms || []
      })

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL query failed')
      }

      const atoms = result.data?.atoms || []
      const accounts: FollowedAccount[] = []

      // Extract follow triples from Thing atom
      atoms.forEach(atom => {
        atom.as_subject_triples?.forEach(triple => {
          accounts.push({
            id: triple.object.term_id,
            label: triple.object.label,
            termId: triple.object.term_id,
            tripleId: triple.term_id,
            followDate: new Date(triple.created_at).toLocaleDateString(),
            trustAmount: "0"
          })
        })
      })

      setFollowedAccounts(accounts)
      console.log('✅ TrustCircleTab - Trust circle loaded', {
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
        <p>Accounts you follow and trust with your TRUST tokens</p>
        <div className="stats">
          <span className="stat">
            <strong>{followedAccounts.length}</strong> following
          </span>
        </div>
      </div>

      {followedAccounts.length === 0 ? (
        <div className="empty-state">
          <h3>No Trust Relationships Yet</h3>
          <p>Start following accounts in the Account tab to build your trust circle.</p>
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

              <div className="account-actions">
                <button
                  className="unfollow-button"
                  onClick={() => handleUnfollow(account)}
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrustCircleTab