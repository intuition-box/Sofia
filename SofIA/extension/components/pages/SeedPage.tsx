import React, { useState, useEffect } from 'react'
import { Storage } from '@plasmohq/storage'
import '../styles/MyGraphPage.css'

const storage = new Storage()

const SeedPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>(['🚀 SofIA Seeder ready...'])
  const [stats, setStats] = useState({ messages: 0, triplets: 0, created: 0, existing: 0 })
  const [isSeeding, setIsSeeding] = useState(false)

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearLogs = () => {
    setLogs(['Logs cleared...'])
  }

  // Messages SofIA simulés
  const mockMessages = [
    {
      id: `test_${Date.now()}_1`,
      content: {
        text: `Analyse: L'utilisateur explore des projets blockchain.
        
Triplets extraits:
- User visits Github
- User explores Ethereum  
- User researches DeFi
- User studies Smart-Contracts`,
        type: "analysis"
      },
      created_at: Date.now() - 3600000,
      processed: false
    },
    {
      id: `test_${Date.now()}_2`,
      content: {
        text: `Observation: L'utilisateur développe en React.
        
Triplets détectés:
- User codes React-Applications
- User uses TypeScript
- User deploys Vercel
- User manages Github-Repositories`,
        type: "observation"
      },
      created_at: Date.now() - 7200000,
      processed: false
    },
    {
      id: `test_${Date.now()}_3`,
      content: {
        text: `Comportement: L'utilisateur utilise MetaMask.
        
Relations identifiées:
- User uses MetaMask
- User deploys Smart-Contracts
- User tests Sepolia-Testnet
- User integrates Web3`,
        type: "behavior"
      },
      created_at: Date.now() - 10800000,
      processed: false
    }
  ]

  // Triplets de test
  const mockTriplets = [
    {
      id: `triplet_${Date.now()}_1`,
      triplet: { subject: "User", predicate: "builds", object: "React-Apps" },
      atomVaultId: "pending",
      source: "created" as const,
      url: "https://react.dev",
      ipfsUri: "pending",
      tripleStatus: "atom-only" as const,
      timestamp: Date.now() - 60000,
      originalMessage: {
        rawObjectDescription: "Modern React application development",
        rawObjectUrl: "https://react.dev"
      }
    },
    {
      id: `triplet_${Date.now()}_2`, 
      triplet: { subject: "User", predicate: "learns", object: "TypeScript" },
      atomVaultId: "pending",
      source: "created" as const,
      url: "https://typescriptlang.org",
      ipfsUri: "pending",
      tripleStatus: "atom-only" as const, 
      timestamp: Date.now() - 120000,
      originalMessage: {
        rawObjectDescription: "TypeScript programming language",
        rawObjectUrl: "https://typescriptlang.org"
      }
    },
    {
      id: `triplet_${Date.now()}_3`,
      triplet: { subject: "User", predicate: "uses", object: "MetaMask" },
      atomVaultId: "pending",
      source: "existing" as const,
      url: "https://metamask.io", 
      ipfsUri: "pending",
      tripleStatus: "atom-only" as const,
      timestamp: Date.now() - 180000,
      originalMessage: {
        rawObjectDescription: "MetaMask wallet for Web3",
        rawObjectUrl: "https://metamask.io"
      }
    },
    {
      id: `triplet_${Date.now()}_4`,
      triplet: { subject: "User", predicate: "deploys", object: "Smart-Contracts" },
      atomVaultId: "pending",
      source: "created" as const,
      url: "https://ethereum.org",
      ipfsUri: "pending",
      tripleStatus: "atom-only" as const,
      timestamp: Date.now() - 240000,
      originalMessage: {
        rawObjectDescription: "Ethereum smart contract deployment",
        rawObjectUrl: "https://ethereum.org"
      }
    },
    {
      id: `triplet_${Date.now()}_5`,
      triplet: { subject: "User", predicate: "explores", object: "Account-Abstraction" },
      atomVaultId: "pending",
      source: "created" as const,
      url: "https://eips.ethereum.org/EIPS/eip-4337",
      ipfsUri: "pending",
      tripleStatus: "atom-only" as const,
      timestamp: Date.now() - 300000,
      originalMessage: {
        rawObjectDescription: "ERC-4337 Account Abstraction standard",
        rawObjectUrl: "https://eips.ethereum.org/EIPS/eip-4337"
      }
    }
  ]

  // Seed messages dans buffer
  const seedMessages = async () => {
    try {
      log('🌱 Seeding messages...')
      
      const existing = await storage.get("sofiaMessagesBuffer") || []
      const newBuffer = [...existing, ...mockMessages]
      await storage.set("sofiaMessagesBuffer", newBuffer)
      
      log(`✅ ${mockMessages.length} messages ajoutés au buffer`)
      
    } catch (error) {
      log(`❌ Erreur: ${error.message}`)
    }
  }

  // Seed triplets avec système chunks
  const seedTriplets = async () => {
    try {
      log('🎯 Seeding triplets avec système chunks...')
      
      // Récupérer l'index existant
      const index = await storage.get("onChainTriplets_index") || { chunks: [], totalCount: 0, lastChunk: null }
      log(`📦 Index existant: ${index.chunks.length} chunks, ${index.totalCount} triplets`)
      
      // Charger tous les triplets existants depuis les chunks
      let allTriplets = []
      for (const chunkKey of index.chunks) {
        const chunkData = await storage.get(chunkKey) || []
        allTriplets.push(...chunkData)
      }
      
      // Ajouter les nouveaux triplets
      const newTriplets = [...allTriplets, ...mockTriplets]
      log(`📊 Total après ajout: ${newTriplets.length} triplets`)
      
      // Recréer les chunks (8 triplets par chunk)
      const CHUNK_SIZE = 8
      const newChunks = []
      
      // Supprimer les anciens chunks
      for (const chunkKey of index.chunks) {
        await storage.remove(chunkKey)
      }
      
      // Créer les nouveaux chunks
      for (let i = 0; i < newTriplets.length; i += CHUNK_SIZE) {
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1
        const chunkKey = `onChainTriplets_${chunkNumber}`
        const chunkData = newTriplets.slice(i, i + CHUNK_SIZE)
        
        await storage.set(chunkKey, chunkData)
        newChunks.push(chunkKey)
        log(`💾 Chunk ${chunkNumber}: ${chunkData.length} triplets`)
      }
      
      // Mettre à jour l'index
      const newIndex = {
        chunks: newChunks,
        totalCount: newTriplets.length,
        lastChunk: newChunks.length > 0 ? newChunks[newChunks.length - 1] : null
      }
      await storage.set("onChainTriplets_index", newIndex)
      
      log(`✅ ${mockTriplets.length} triplets ajoutés (système chunks)`)
      log(`📊 ${newChunks.length} chunks créés`)
      
    } catch (error) {
      log(`❌ Erreur: ${error.message}`)
    }
  }

  // Seed all
  const seedAll = async () => {
    if (isSeeding) return
    setIsSeeding(true)
    
    try {
      log('🚀 Seeding all data...')
      await seedMessages()
      await seedTriplets()
      await showStats()
      log('🎉 Seeding terminé! Allez dans l\'onglet Echoes pour voir les triplets.')
    } catch (error) {
      log(`❌ Erreur générale: ${error.message}`)
    } finally {
      setIsSeeding(false)
    }
  }

  // Afficher les stats
  const showStats = async () => {
    try {
      const messages = await storage.get("sofiaMessagesBuffer") || []
      
      // Lire les triplets depuis le système de chunks
      const index = await storage.get("onChainTriplets_index") || { chunks: [], totalCount: 0 }
      let triplets = []
      
      for (const chunkKey of index.chunks) {
        const chunkData = await storage.get(chunkKey) || []
        triplets.push(...chunkData)
      }
      
      const created = triplets.filter(t => t.source === 'created').length
      const existing = triplets.filter(t => t.source === 'existing').length
      
      setStats({
        messages: messages.length,
        triplets: triplets.length,
        created,
        existing
      })
      
      log(`📊 Stats: ${messages.length} messages, ${triplets.length} triplets`)
      log(`📦 Chunks: ${index.chunks.length} chunks, index total: ${index.totalCount}`)
      
    } catch (error) {
      log(`❌ Erreur stats: ${error.message}`)
    }
  }

  // Clear all
  const clearAll = async () => {
    if (!confirm('⚠️ Effacer toutes les données ?')) return
    
    try {
      log('🧹 Clearing all data...')
      
      // Clear messages
      await storage.remove("sofiaMessagesBuffer")
      await storage.remove("extractedTriplets_index")
      
      // Clear triplets chunks
      const index = await storage.get("onChainTriplets_index") || { chunks: [] }
      for (const chunkKey of index.chunks) {
        await storage.remove(chunkKey)
        log(`🗑️ Removed chunk: ${chunkKey}`)
      }
      await storage.remove("onChainTriplets_index")
      
      // Clear extracted triplets chunks aussi
      for (let i = 1; i <= 20; i++) {
        await storage.remove(`extractedTriplets_${i}`)
      }
      
      log('✅ Toutes les données effacées')
      setStats({ messages: 0, triplets: 0, created: 0, existing: 0 })
      
    } catch (error) {
      log(`❌ Erreur: ${error.message}`)
    }
  }

  // Charger les stats au démarrage
  useEffect(() => {
    showStats()
  }, [])

  return (
    <div className="triples-container">
      <div className="dashboard-header">
        <h2>🌱 SofIA Storage Seeder</h2>
        <p>Seed votre extension avec des données de test pour Account Abstraction</p>
      </div>

      {/* Stats */}
      <div className="signals-stats">
        <div className="stat-item">
          <span className="stat-number stat-atom-only">{stats.messages}</span>
          <span className="stat-label">Messages</span>
        </div>
        <div className="stat-item">
          <span className="stat-number stat-created">{stats.triplets}</span>
          <span className="stat-label">Triplets</span>
        </div>
        <div className="stat-item">
          <span className="stat-number stat-existing">{stats.created}</span>
          <span className="stat-label">Created</span>
        </div>
        <div className="stat-item">
          <span className="stat-number stat-on-chain">{stats.existing}</span>
          <span className="stat-label">Existing</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button 
          className="btn-primary"
          onClick={seedAll}
          disabled={isSeeding}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isSeeding ? 0.6 : 1
          }}
        >
          {isSeeding ? '⏳ Seeding...' : '🚀 Seed All (Messages + Triplets)'}
        </button>
        
        <button 
          className="btn-secondary"
          onClick={seedMessages}
          disabled={isSeeding}
          style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            color: '#4a5568',
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            opacity: isSeeding ? 0.6 : 1
          }}
        >
          📬 Seed Messages Only
        </button>
        
        <button 
          className="btn-secondary"
          onClick={seedTriplets}
          disabled={isSeeding}
          style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            color: '#4a5568',
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            opacity: isSeeding ? 0.6 : 1
          }}
        >
          🎯 Seed Triplets Only
        </button>
        
        <button 
          className="btn-secondary"
          onClick={showStats}
          disabled={isSeeding}
          style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            color: '#4a5568',
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            opacity: isSeeding ? 0.6 : 1
          }}
        >
          📊 Refresh Stats
        </button>
        
        <button 
          onClick={clearAll}
          disabled={isSeeding}
          style={{
            background: '#f56565',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            opacity: isSeeding ? 0.6 : 1
          }}
        >
          🧹 Clear All
        </button>
      </div>

      {/* Logs */}
      <div style={{
        background: '#2d3748',
        color: '#68d391',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '15px'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <button 
        onClick={clearLogs}
        style={{
          background: '#4a5568',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Clear Logs
      </button>

      {/* Instructions */}
      <div style={{
        background: '#e8f4f8',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        borderLeft: '4px solid #667eea'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>📋 Instructions</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#4a5568' }}>
          <li>Cliquez "<strong>🚀 Seed All</strong>" pour créer les données de test</li>
          <li>Allez dans l'onglet "<strong>Echoes</strong>" pour voir les triplets pending</li>
          <li>Activez le "<strong>🚀 Batch Mode</strong>" pour tester Account Abstraction</li>
          <li>Sélectionnez les triplets et testez la création batch !</li>
        </ol>
      </div>
    </div>
  )
}

export default SeedPage