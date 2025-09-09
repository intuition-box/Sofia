import { useState } from 'react'
import { useLocalPublishedTriplets } from '../../../hooks/useLocalPublishedTriplets'
import QuickActionButton from '../../ui/QuickActionButton'
import { useStorage } from "@plasmohq/storage/hook"
import '../../styles/AtomCreationModal.css'
import '../../styles/CorePage.css'

interface SignalsTabProps {
  expandedTriplet: { tripletId: string } | null
  setExpandedTriplet: (value: { tripletId: string } | null) => void
}

const SignalsTab = ({ expandedTriplet, setExpandedTriplet }: SignalsTabProps) => {
  const { triplets, isLoading, error, refreshFromLocal } = useLocalPublishedTriplets()
  const [address] = useStorage<string>("metamask-account")
  
  // Display locally published triplets (already sorted by timestamp)
  const publishedTriplets = triplets
  
  const publishedCounts = {
    total: publishedTriplets.length,
    local: publishedTriplets.filter(t => t.source === 'created').length,
    existing: publishedTriplets.filter(t => t.source === 'existing').length,
  }

  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    if (num >= 1000000000) {
      const formatted = (num / 1000000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B'
    }
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M'
    }
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'K' : formatted + 'K'
    }
    return num.toLocaleString()
  }

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getTripletMetrics = (triplet: any) => {
    // For now, generate mock metrics based on the triplet predicate
    // In a real implementation, this would fetch actual voting data from the blockchain
    const predicate = triplet.triplet.predicate.toLowerCase()
    
    // Base metrics simulation based on the type of predicate
    let baseVotes = Math.floor(Math.random() * 500) + 50 // Random base between 50-550
    
    if (predicate.includes('supports') || predicate.includes('likes') || predicate.includes('endorses')) {
      return {
        forCount: Math.floor(baseVotes * 0.7),
        against: Math.floor(baseVotes * 0.2),
        neutral: Math.floor(baseVotes * 0.1)
      }
    } else if (predicate.includes('against') || predicate.includes('opposes') || predicate.includes('disagrees')) {
      return {
        forCount: Math.floor(baseVotes * 0.15),
        against: Math.floor(baseVotes * 0.75),
        neutral: Math.floor(baseVotes * 0.1)
      }
    } else {
      return {
        forCount: Math.floor(baseVotes * 0.4),
        against: Math.floor(baseVotes * 0.3),
        neutral: Math.floor(baseVotes * 0.3)
      }
    }
  }

  const handleViewOnExplorer = (txHash?: string, vaultId?: string) => {
    if (txHash) {
      // Intuition Testnet explorer
      window.open(`https://testnet.explorer.intuition.systems/tx/${txHash}`, '_blank')
    } else if (vaultId) {
      console.log('🔍 View vault:', vaultId)
      // TODO: Link to vault explorer
    }
  }


  if (!address) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>🔌 Connect your wallet</p>
          <p className="empty-subtext">
            Connect your MetaMask wallet to view your on-chain triplets
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Loading your published triplets...</p>
          <p className="empty-subtext">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="triples-container">
        <div className="empty-state">
          <p>Error loading local triplets</p>
          <p className="empty-subtext">{error}</p>
          <button onClick={refreshFromLocal} className="retry-button">
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="triples-container">


      {publishedTriplets.length > 0 ? (
        publishedTriplets.map((tripletItem) => {
          const isExpanded = expandedTriplet?.tripletId === tripletItem.id

          return (
            <div key={tripletItem.id} className={`echo-card border-green`}>
              <div className={`triplet-item ${isExpanded ? 'expanded' : ''}`}>
                
                {/* Header avec badges et actions */}
                <div className="triplet-header">
                  

                {/* Texte du triplet */}
                <p className="triplet-text clickable" onClick={() => {
                  setExpandedTriplet(isExpanded ? null : { tripletId: tripletItem.id })
                }}>
                  <span className="subject">{formatWalletAddress(tripletItem.triplet.subject)}</span><br />
                  <span className="action">{tripletItem.triplet.predicate}</span><br />
                  <span className="object">{tripletItem.triplet.object}</span>
                </p>

                {/* Voting metrics */}
                <div className="sentiment-metrics" style={{marginTop: '8px', marginBottom: '4px'}}>
                  {(() => {
                    const metrics = getTripletMetrics(tripletItem)
                    return (
                      <>
                        <span className="sentiment-metric positive" style={{
                          backgroundColor: '#e8f5e8',
                          color: '#2d5a2d',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          marginRight: '4px'
                        }}>
                          {formatNumber(metrics.forCount)}
                        </span>
                        <span className="sentiment-metric neutral" style={{
                          backgroundColor: '#f5f5f5',
                          color: '#666',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          marginRight: '4px'
                        }}>
                          {formatNumber(metrics.neutral)}
                        </span>
                        <span className="sentiment-metric negative" style={{
                          backgroundColor: '#ffeaea',
                          color: '#5a2d2d',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {formatNumber(metrics.against)}
                        </span>
                      </>
                    )
                  })()}
                </div>

                </div>
                  {/* Actions à droite - uniquement scan/view */}
                  <div className="signal-actions">
                    <QuickActionButton
                      action="scan"
                      onClick={() => handleViewOnExplorer(tripletItem.txHash, tripletItem.tripleVaultId)}
                    />
                  </div>
                {isExpanded && (
                  <div className="triplet-details">
                    <div className="triplet-detail-section">
                      <div className="triplet-detail-section">
                        <h4 className="triplet-detail-title">📊 Community Voting</h4>
                        {(() => {
                          const metrics = getTripletMetrics(tripletItem)
                          const total = metrics.forCount + metrics.against + metrics.neutral
                          return (
                            <>
                              <div style={{marginBottom: '8px'}}>
                                <p className="triplet-detail-name">
                                  Support: {formatNumber(metrics.forCount)} ({Math.round((metrics.forCount / total) * 100)}%)
                                </p>
                                <p className="triplet-detail-name">
                                  Neutral: {formatNumber(metrics.neutral)} ({Math.round((metrics.neutral / total) * 100)}%)
                                </p>
                                <p className="triplet-detail-name">
                                  Against: {formatNumber(metrics.against)} ({Math.round((metrics.against / total) * 100)}%)
                                </p>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '6px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                display: 'flex'
                              }}>
                                <div style={{
                                  width: `${(metrics.forCount / total) * 100}%`,
                                  backgroundColor: '#4CAF50',
                                  height: '100%'
                                }}></div>
                                <div style={{
                                  width: `${(metrics.neutral / total) * 100}%`,
                                  backgroundColor: '#9E9E9E',
                                  height: '100%'
                                }}></div>
                                <div style={{
                                  width: `${(metrics.against / total) * 100}%`,
                                  backgroundColor: '#F44336',
                                  height: '100%'
                                }}></div>
                              </div>
                              <p className="triplet-detail-name" style={{fontSize: '11px', color: '#666', marginTop: '4px'}}>
                                Total votes: {formatNumber(total)}
                              </p>
                            </>
                          )
                        })()}
                      </div>
                      <h4 className="triplet-detail-title">🧍 Subject</h4>
                      <p className="triplet-detail-name">{formatWalletAddress(tripletItem.triplet.subject)}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🔗 Predicate</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.predicate}</p>
                    </div>

                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">📄 Object</h4>
                      <p className="triplet-detail-name">{tripletItem.triplet.object}</p>
                    </div>

                    <div className="triplet-detail-section">
                      {/* <h4 className="triplet-detail-title">⛓️ Blockchain</h4>
                      {tripletItem.objectVaultId && (
                        <p className="triplet-detail-name">Object VaultID: {tripletItem.objectVaultId.slice(0, 10)}...{tripletItem.objectVaultId.slice(-8)}</p>
                      )}
                      {tripletItem.tripleVaultId && (
                        <p className="triplet-detail-name">Triple VaultID: {tripletItem.tripleVaultId}</p>
                      )}
                      {tripletItem.subjectVaultId && (
                        <p className="triplet-detail-name">Subject VaultID: {tripletItem.subjectVaultId.slice(0, 10)}...{tripletItem.subjectVaultId.slice(-8)}</p>
                      )}
                      {tripletItem.predicateVaultId && (
                        <p className="triplet-detail-name">Predicate VaultID: {tripletItem.predicateVaultId.slice(0, 10)}...{tripletItem.predicateVaultId.slice(-8)}</p>
                      )}
                      <p className="triplet-detail-name">
                        TX: {tripletItem.txHash.slice(0, 10)}...{tripletItem.txHash.slice(-8)}
                      </p>
                      {tripletItem.blockNumber && (
                        <p className="triplet-detail-name">Block: {tripletItem.blockNumber}</p>
                      )}
                      <p className="triplet-detail-name">Status: ⛓️ On-Chain (Local)</p> */}
                    </div>


                    <div className="triplet-detail-section">
                      <h4 className="triplet-detail-title">🌐 Source</h4>
                      <p className="triplet-detail-name">
                        Published from Echoes Tab ({tripletItem.source === 'created' ? 'New Triple' : 'Existing Triple'})
                      </p>
                      <p className="triplet-detail-timestamp">
                        {new Date(tripletItem.timestamp).toLocaleString()}
                      </p>
                      <p className="triplet-detail-name">
                        Creator: {address?.slice(0, 8)}...{address?.slice(-6)}
                      </p>
                      <p className="triplet-detail-name">
                        Original URL: <a href={tripletItem.url} target="_blank" rel="noopener noreferrer" style={{color: '#4A90E2'}}>{tripletItem.url.slice(0, 50)}...</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <p>📡 No Published Triplets Found</p>
          <p className="empty-subtext">
            Triplets you publish from Echoes tab will appear here automatically.<br/>
            Create some triplets to see them displayed with full blockchain details!
          </p>
          <button onClick={refreshFromLocal} className="refresh-button">
            Refresh Local Storage
          </button>
        </div>
      )}
    </div>
  )
}

export default SignalsTab