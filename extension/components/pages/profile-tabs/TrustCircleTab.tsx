import { useState, useEffect } from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { sessionWallet } from '../../../lib/services/sessionWallet'
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
  const [useSessionWallet] = useStorage<boolean>("sofia-use-session-wallet", false)
  const [followedAccounts, setFollowedAccounts] = useState<FollowedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    loadTrustCircle()
  }, [address, useSessionWallet])

  const loadTrustCircle = async () => {
    try {
      // Get session wallet address if enabled
      const sessionStatus = sessionWallet.getStatus()
      const sessionWalletAddress = useSessionWallet && sessionStatus.isReady ? sessionStatus.address : null

      console.log('🔍 TrustCircleTab - Loading trust circle', {
        userAddress: address,
        sessionWalletAddress,
        useSessionWallet
      })

      setLoading(true)
      setError(null)

      // Create addresses array for positions search
      const addressesToSearch = [address]
      if (sessionWalletAddress && sessionWalletAddress !== address) {
        addressesToSearch.push(sessionWalletAddress)
      }

      // Query to search positions in both wallets
      const combinedQuery = `
        query GetUserAndFollows($userLabel: String!, $predicateId: String!, $addresses: [String!]!) {
          user_atoms: atoms(where: {
            label: { _eq: $userLabel }
          }, limit: 1) {
            term_id
            label
            type
          }

          all_user_triples: triples(
            where: {
              _and: [
                {predicate_id: {_eq: $predicateId}},
                {positions: {account_id: {_in: $addresses}, shares: {_gt: "0"}}}
              ]
            }
          ) {
            term_id
            created_at
            subject { term_id label image }
            predicate { term_id label }
            object { term_id label image }
            positions(where: {account_id: {_in: $addresses}, shares: {_gt: "0"}}) {
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
            userLabel: address,
            predicateId: "0x8f9b5dc2e7b8bd12f6762c839830672f1d13c08e72b5f09f194cafc153f2df8a",
            addresses: addressesToSearch
          }
        })
      })

      const result = await response.json()

      console.log('✅ TrustCircleTab - Combined GraphQL response', {
        userAtoms: result.data?.user_atoms || [],
        allUserTriples: result.data?.all_user_triples || [],
        triplesFound: result.data?.all_user_triples?.length || 0,
        addressesToSearch,
        sessionWalletAddress,
        errors: result.errors
      })

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL query failed')
      }

      // Vérifier si l'utilisateur existe
      const userAtoms = result.data?.user_atoms || []
      if (userAtoms.length === 0) {
        console.log('❌ TrustCircleTab - User atom not found:', address)
        setFollowedAccounts([])
        return
      }

      const userAtom = userAtoms[0]
      console.log('✅ TrustCircleTab - User atom found:', {
        termId: userAtom.term_id,
        label: userAtom.label,
        type: userAtom.type
      })

      const triples = result.data?.all_user_triples || []
      console.log('🔍 TrustCircleTab - Analyzing triples with positions:', {
        totalTriples: triples.length,
        triplesDetails: triples.map(t => ({
          tripleId: t.term_id,
          subjectId: t.subject.term_id,
          predicateId: t.predicate.term_id,
          objectLabel: t.object.label,
          positions: t.positions?.map(p => ({
            account: p.account_id,
            shares: p.shares,
            isSessionWallet: p.account_id === sessionWalletAddress
          }))
        }))
      })

      const accounts: FollowedAccount[] = []

      // Extract follow triples with position information
      triples.forEach(triple => {
        // Calculate total trust amount from all positions
        const totalShares = triple.positions?.reduce((sum, pos) => {
          return sum + parseFloat(pos.shares || "0")
        }, 0) || 0

        // Determine which wallet has the position
        const walletInfo = triple.positions?.map(pos => ({
          wallet: pos.account_id === sessionWalletAddress ? 'Session' : 'Main',
          shares: pos.shares
        })) || []

        accounts.push({
          id: triple.object.term_id,
          label: triple.object.label,
          termId: triple.object.term_id,
          tripleId: triple.term_id,
          followDate: new Date(triple.created_at).toLocaleDateString(),
          trustAmount: totalShares.toFixed(4),
          walletInfo: walletInfo // Add wallet info for debugging
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
        <p>Accounts you follow</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrustCircleTab