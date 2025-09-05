import { useState } from 'react'
import { getClients } from '../lib/viemClients'
import { stringToHex } from 'viem'

// Test different ABI signatures for all needed functions
const TEST_FUNCTIONS = [
  // Cost functions
  {
    "type": "function",
    "name": "getAtomCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function", 
    "name": "getTripleCost",
    "inputs": [],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  // Create functions V2 (test different signatures)
  {
    "type": "function",
    "name": "createAtoms",
    "inputs": [
      {"type": "bytes[]", "name": "atomDatas"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createTriples",
    "inputs": [
      {"type": "bytes32[]", "name": "subjectIds"},
      {"type": "bytes32[]", "name": "predicateIds"},
      {"type": "bytes32[]", "name": "objectIds"},
      {"type": "uint256[]", "name": "assets"}
    ],
    "outputs": [{"type": "bytes32[]", "name": ""}],
    "stateMutability": "payable"
  },
  // Legacy V1 functions to test
  {
    "type": "function",
    "name": "createAtom",
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "depositAtom", 
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "mint",
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "create", 
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "deployAtom",
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "addAtom",
    "inputs": [{"type": "string", "name": "uri"}],
    "outputs": [{"type": "uint256", "name": "vaultId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createTriple",
    "inputs": [
      {"type": "uint256", "name": "subjectId"},
      {"type": "uint256", "name": "predicateId"},
      {"type": "uint256", "name": "objectId"}
    ],
    "outputs": [{"type": "uint256", "name": "tripleId"}],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createTriple",
    "inputs": [
      {"type": "uint256", "name": "subjectId"},
      {"type": "uint256", "name": "predicateId"},
      {"type": "uint256", "name": "objectId"},
      {"type": "uint256", "name": "initialDeposit"}
    ],
    "outputs": [{"type": "uint256", "name": "tripleId"}],
    "stateMutability": "payable"
  },
  // Hash/lookup functions - try different names
  {
    "type": "function",
    "name": "atomsByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAtomByHash",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "atoms",
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "triplesByHash", 
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTripleByHash", 
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "triples", 
    "inputs": [{"type": "bytes32", "name": "hash"}],
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tripleHashFromAtoms",
    "inputs": [
      {"type": "uint256", "name": "subjectId"},
      {"type": "uint256", "name": "predicateId"},
      {"type": "uint256", "name": "objectId"}
    ],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTripleHash",
    "inputs": [
      {"type": "uint256", "name": "subjectId"},
      {"type": "uint256", "name": "predicateId"},
      {"type": "uint256", "name": "objectId"}
    ],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashTriple",
    "inputs": [
      {"type": "uint256", "name": "subjectId"},
      {"type": "uint256", "name": "predicateId"},
      {"type": "uint256", "name": "objectId"}
    ],
    "outputs": [{"type": "bytes32", "name": ""}],
    "stateMutability": "view"
  }
]

export const useContractTest = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const testContract = async () => {
    setIsLoading(true)
    setResults([])
    
    const testResults: string[] = []
    
    try {
      const { publicClient } = await getClients()
      const multiVaultAddress = "0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d"
      
      // Test view functions first
      const viewFunctions = TEST_FUNCTIONS.filter(f => f.stateMutability === 'view')
      
      for (const func of viewFunctions) {
        try {
          console.log(`🧪 Testing ${func.name}...`)
          
          let result: any
          if (func.inputs.length === 0) {
            // Functions without parameters
            result = await publicClient.readContract({
              address: multiVaultAddress,
              abi: [func],
              functionName: func.name as any
            })
            testResults.push(`✅ ${func.name}(): ${result.toString()}`)
          } else if (func.name.includes('Hash') && func.inputs.length === 1) {
            // Test hash lookup functions with a dummy hash
            result = await publicClient.readContract({
              address: multiVaultAddress,
              abi: [func],
              functionName: func.name as any,
              args: ['0x0000000000000000000000000000000000000000000000000000000000000001']
            })
            testResults.push(`✅ ${func.name}(dummy): ${result.toString()}`)
          } else if (func.name.includes('Hash') && func.inputs.length === 3) {
            // Test triple hash functions with dummy atom IDs
            result = await publicClient.readContract({
              address: multiVaultAddress,
              abi: [func],
              functionName: func.name as any,
              args: [1n, 2n, 3n]
            })
            testResults.push(`✅ ${func.name}(1,2,3): ${result.toString()}`)
          } else if (func.name === 'atoms' || func.name === 'triples') {
            // Test simple mapping functions
            result = await publicClient.readContract({
              address: multiVaultAddress,
              abi: [func],
              functionName: func.name as any,
              args: ['0x0000000000000000000000000000000000000000000000000000000000000001']
            })
            testResults.push(`✅ ${func.name}(dummy): ${result.toString()}`)
          }
        } catch (error) {
          testResults.push(`❌ ${func.name}: ${error.message.slice(0, 100)}...`)
        }
      }
      
      // Check wallet balance first
      const { walletClient } = await getClients()
      const balance = await publicClient.getBalance({
        address: walletClient.account?.address!
      })
      testResults.push(`💰 Wallet balance: ${balance.toString()} wei (${(Number(balance) / 1e18).toFixed(6)} ETH)`)
      
      const atomCost = 1000000001000000n // We know this value works
      const testUri = "ipfs://bafkreib47qoatkhmeqspvaazjxlezjlxf3nvqahuoybaufxlenaxcjy54i"
      testResults.push(`💸 Atom cost: ${atomCost.toString()} wei (${(Number(atomCost) / 1e18).toFixed(6)} ETH)`)
      
      if (balance < atomCost) {
        testResults.push(`❌ INSUFFICIENT BALANCE: Need ${atomCost.toString()} wei, have ${balance.toString()} wei`)
        setResults(testResults)
        setIsLoading(false)
        return
      }
      
      // Test createAtom signatures with simulation
      const createAtomFunctions = TEST_FUNCTIONS.filter(f => 
        f.stateMutability === 'payable' && 
        (f.name === 'createAtoms' || f.name === 'createAtom' || f.name === 'depositAtom' || 
         f.name === 'mint' || f.name === 'create' || f.name === 'deployAtom' || f.name === 'addAtom')
      )
      
      for (const func of createAtomFunctions) {
        try {
          console.log(`🧪 Simulating ${func.name}...`)
          
          let args: any[]
          if (func.name === 'createAtoms') {
            // V2 createAtoms(bytes[], uint256[])
            // Convert IPFS URI to proper bytes encoding
            const encodedUri = stringToHex(testUri)
            args = [[encodedUri], [atomCost]] // Arrays for batch creation
          } else if (func.inputs.length === 1 && func.inputs[0].type === 'string') {
            args = [testUri]
          } else if (func.inputs.length === 2) {
            args = [testUri, atomCost]
          } else if (func.inputs.length === 1 && func.inputs[0].type === 'bytes') {
            args = [testUri] // Try string as bytes
          } else {
            continue
          }
          
          // Test on MultiVault
          await publicClient.simulateContract({
            address: multiVaultAddress,
            abi: [func],
            functionName: func.name as any,
            args: args,
            value: atomCost,
            account: walletClient?.account
          })
          testResults.push(`✅ ${func.name}(${func.inputs.map(i => i.type).join(',')}): SUCCESS`)
        } catch (error) {
          testResults.push(`❌ ${func.name}: ${error.message.slice(0, 100)}...`)
        }
      }
      
    } catch (error) {
      testResults.push(`❌ Global error: ${error.message}`)
    } finally {
      setResults(testResults)
      setIsLoading(false)
    }
  }

  return {
    testContract,
    isLoading,
    results
  }
}