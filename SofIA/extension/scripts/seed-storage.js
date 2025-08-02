/**
 * Script pour seeder le storage Plasmo avec des données de test SofIA
 * Utilisation: node scripts/seed-storage.js
 */

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Messages SofIA simulés pour tester l'Account Abstraction
const mockSofiaMessages = [
  {
    id: `test_${Date.now()}_1`,
    content: {
      text: `Analyse: L'utilisateur explore des projets blockchain innovants.
      
Triplets extraits:
- User visits Github
- User explores Ethereum
- User researches DeFi
- User studies Smart-Contracts
- User analyzes Web3-Architecture`,
      type: "analysis"
    },
    created_at: Date.now() - 3600000, // 1 heure avant
    processed: false
  },
  {
    id: `test_${Date.now()}_2`, 
    content: {
      text: `Observation: L'utilisateur s'intéresse aux technologies d'IA et machine learning.
      
Triplets détectés:
- User reads OpenAI-Documentation
- User follows AI-Research
- User bookmarks ChatGPT
- User studies Machine-Learning
- User explores Neural-Networks`,
      type: "observation"
    },
    created_at: Date.now() - 7200000, // 2 heures avant
    processed: false
  },
  {
    id: `test_${Date.now()}_3`,
    content: {
      text: `Comportement: L'utilisateur développe activement en React et TypeScript.
      
Relations identifiées:
- User codes React-Applications
- User uses TypeScript
- User contributes Open-Source
- User deploys Vercel
- User manages Github-Repositories`,
      type: "behavior"
    },
    created_at: Date.now() - 10800000, // 3 heures avant
    processed: false
  },
  {
    id: `test_${Date.now()}_4`,
    content: {
      text: `Patterns: L'utilisateur suit des tendances en développement Web3.
      
Triplets observés:
- User learns Solidity
- User uses Hardhat
- User deploys Smart-Contracts
- User tests Sepolia-Testnet
- User integrates MetaMask`,
      type: "patterns"
    },
    created_at: Date.now() - 14400000, // 4 heures avant
    processed: false
  },
  {
    id: `test_${Date.now()}_5`,
    content: {
      text: `Activité: L'utilisateur participe à l'écosystème crypto et DeFi.
      
Connections trouvées:
- User trades Uniswap
- User stakes Ethereum
- User uses Compound
- User explores Aave
- User monitors DeFi-Pulse`,
      type: "activity"
    },
    created_at: Date.now() - 18000000, // 5 heures avant
    processed: false
  }
]

// Fonction pour seeder les messages dans le buffer
async function seedSofiaMessages() {
  try {
    console.log('🌱 Seeding SofIA messages buffer...')
    
    // Récupérer le buffer existant ou créer un nouveau
    const existingBuffer = await storage.get("sofiaMessagesBuffer") || []
    console.log(`📦 Buffer existant: ${existingBuffer.length} messages`)
    
    // Ajouter les nouveaux messages de test
    const newBuffer = [...existingBuffer, ...mockSofiaMessages]
    await storage.set("sofiaMessagesBuffer", newBuffer)
    
    console.log(`✅ ${mockSofiaMessages.length} messages ajoutés au buffer`)
    console.log(`📊 Total buffer: ${newBuffer.length} messages`)
    
  } catch (error) {
    console.error('❌ Erreur seeding messages:', error)
  }
}

// Fonction pour créer des triplets déjà importés (pour tester le batch)
async function seedPendingTriplets() {
  try {
    console.log('🌱 Seeding pending triplets...')
    
    const pendingTriplets = [
      {
        id: `triplet_${Date.now()}_1`,
        triplet: {
          subject: "User",
          predicate: "builds",
          object: "React-Apps"
        },
        atomVaultId: "pending",
        source: "created",
        url: "https://react.dev",
        ipfsUri: "pending",
        tripleStatus: "atom-only",
        timestamp: Date.now() - 60000,
        originalMessage: {
          rawObjectDescription: "Modern React application development",
          rawObjectUrl: "https://react.dev"
        }
      },
      {
        id: `triplet_${Date.now()}_2`,
        triplet: {
          subject: "User", 
          predicate: "learns",
          object: "TypeScript"
        },
        atomVaultId: "pending",
        source: "created",
        url: "https://typescriptlang.org",
        ipfsUri: "pending", 
        tripleStatus: "atom-only",
        timestamp: Date.now() - 120000,
        originalMessage: {
          rawObjectDescription: "TypeScript programming language",
          rawObjectUrl: "https://typescriptlang.org"
        }
      },
      {
        id: `triplet_${Date.now()}_3`,
        triplet: {
          subject: "User",
          predicate: "deploys",
          object: "Smart-Contracts"
        },
        atomVaultId: "pending",
        source: "created", 
        url: "https://ethereum.org",
        ipfsUri: "pending",
        tripleStatus: "atom-only",
        timestamp: Date.now() - 180000,
        originalMessage: {
          rawObjectDescription: "Ethereum smart contract deployment",
          rawObjectUrl: "https://ethereum.org"
        }
      },
      {
        id: `triplet_${Date.now()}_4`,
        triplet: {
          subject: "User",
          predicate: "uses",
          object: "MetaMask"
        },
        atomVaultId: "pending",
        source: "existing",
        url: "https://metamask.io", 
        ipfsUri: "pending",
        tripleStatus: "atom-only",
        timestamp: Date.now() - 240000,
        originalMessage: {
          rawObjectDescription: "MetaMask wallet for Web3",
          rawObjectUrl: "https://metamask.io"
        }
      },
      {
        id: `triplet_${Date.now()}_5`,
        triplet: {
          subject: "User",
          predicate: "explores", 
          object: "Account-Abstraction"
        },
        atomVaultId: "pending",
        source: "created",
        url: "https://eips.ethereum.org/EIPS/eip-4337",
        ipfsUri: "pending",
        tripleStatus: "atom-only", 
        timestamp: Date.now() - 300000,
        originalMessage: {
          rawObjectDescription: "ERC-4337 Account Abstraction standard",
          rawObjectUrl: "https://eips.ethereum.org/EIPS/eip-4337"
        }
      }
    ]
    
    // Récupérer les triplets existants
    const existingTriplets = await storage.get("pendingTriplets") || []
    console.log(`📦 Triplets existants: ${existingTriplets.length}`)
    
    // Ajouter les nouveaux triplets
    const allTriplets = [...existingTriplets, ...pendingTriplets]
    await storage.set("pendingTriplets", allTriplets)
    
    console.log(`✅ ${pendingTriplets.length} triplets ajoutés`)
    console.log(`📊 Total triplets: ${allTriplets.length}`)
    
  } catch (error) {
    console.error('❌ Erreur seeding triplets:', error)
  }
}

// Fonction pour afficher le statut du storage
async function showStorageStatus() {
  try {
    console.log('\n📊 === STATUS STORAGE SOFIA ===')
    
    const buffer = await storage.get("sofiaMessagesBuffer") || []
    const triplets = await storage.get("pendingTriplets") || []
    const extractedIndex = await storage.get("extractedTriplets_index") || { chunks: [], totalCount: 0 }
    
    console.log(`📬 Messages buffer: ${buffer.length} messages`)
    console.log(`🎯 Pending triplets: ${triplets.length} triplets`)
    console.log(`📚 Extracted chunks: ${extractedIndex.chunks.length} chunks (${extractedIndex.totalCount} total)`)
    
    // Compter les triplets par source
    const createdCount = triplets.filter(t => t.source === 'created').length
    const existingCount = triplets.filter(t => t.source === 'existing').length
    
    console.log(`   └── Created: ${createdCount}`)
    console.log(`   └── Existing: ${existingCount}`)
    
    console.log('✅ Storage status displayed')
    
  } catch (error) {
    console.error('❌ Erreur status:', error)
  }
}

// Fonction pour nettoyer le storage (optional)
async function clearStorage() {
  try {
    console.log('🧹 Cleaning storage...')
    
    await storage.remove("sofiaMessagesBuffer")
    await storage.remove("pendingTriplets")
    await storage.remove("extractedTriplets_index")
    
    // Nettoyer les chunks extracted
    for (let i = 1; i <= 10; i++) {
      await storage.remove(`extractedTriplets_${i}`)
    }
    
    console.log('✅ Storage cleaned')
    
  } catch (error) {
    console.error('❌ Erreur cleaning:', error)
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'seed'
  
  console.log('🚀 SofIA Storage Seeder')
  console.log(`📝 Command: ${command}`)
  console.log('─'.repeat(50))
  
  switch (command) {
    case 'seed':
      await seedSofiaMessages()
      await seedPendingTriplets()
      await showStorageStatus()
      break
      
    case 'messages':
      await seedSofiaMessages()
      break
      
    case 'triplets':
      await seedPendingTriplets()
      break
      
    case 'status':
      await showStorageStatus()
      break
      
    case 'clear':
      await clearStorage()
      break
      
    default:
      console.log('❓ Commandes disponibles:')
      console.log('  seed     - Seed messages + triplets (défaut)')
      console.log('  messages - Seed seulement les messages')
      console.log('  triplets - Seed seulement les triplets')
      console.log('  status   - Afficher le status du storage')
      console.log('  clear    - Nettoyer le storage')
  }
  
  console.log('─'.repeat(50))
  console.log('🎉 Script terminé!')
}

// Exécuter le script
main().catch(console.error)