/**
 * Test script for PredicateAgent
 * Run with: npx tsx test-predicate-agent.ts
 */

const MASTRA_URL = 'http://localhost:4111'

interface TestCase {
  name: string
  input: {
    domain: string
    title: string
    certifications: Record<string, number>
    level: number
    previousPredicate?: string | null
  }
}

const testCases: TestCase[] = [
  {
    name: 'Twitch - Fun majority, Level 2',
    input: {
      domain: 'twitch.tv',
      title: 'twitch.tv',
      certifications: { fun: 4, work: 1 },
      level: 2
    }
  },
  {
    name: 'Twitch - Fun majority, Level 5',
    input: {
      domain: 'twitch.tv',
      title: 'twitch.tv',
      certifications: { fun: 8, work: 2 },
      level: 5
    }
  },
  {
    name: 'GitHub - Learning focus, Level 3',
    input: {
      domain: 'github.com',
      title: 'github.com',
      certifications: { learning: 5, work: 2 },
      level: 3
    }
  },
  {
    name: 'React.dev - Pure learning, Level 7',
    input: {
      domain: 'react.dev',
      title: 'react.dev',
      certifications: { learning: 10 },
      level: 7
    }
  },
  {
    name: 'Amazon - Buying focus, Level 4',
    input: {
      domain: 'amazon.com',
      title: 'amazon.com',
      certifications: { buying: 6, fun: 2 },
      level: 4
    }
  },
  {
    name: 'Twitter - Mixed (inspiration + work), Level 3',
    input: {
      domain: 'twitter.com',
      title: 'twitter.com',
      certifications: { inspiration: 3, work: 3, fun: 1 },
      level: 3
    }
  }
]

async function testPredicateAgent(testCase: TestCase): Promise<void> {
  console.log(`\n📝 Testing: ${testCase.name}`)
  console.log(`   Input: ${JSON.stringify(testCase.input)}`)

  try {
    const response = await fetch(`${MASTRA_URL}/api/agents/predicateAgent/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: JSON.stringify(testCase.input)
        }]
      })
    })

    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`)
      return
    }

    const result = await response.json()
    console.log(`   Raw response: ${result.text}`)

    try {
      const parsed = JSON.parse(result.text)
      console.log(`   ✅ Predicate: "${parsed.predicate}"`)
      console.log(`   📖 Reason: ${parsed.reason}`)
    } catch {
      console.log(`   ⚠️ Could not parse as JSON`)
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`)
  }
}

async function main() {
  console.log('🎯 PredicateAgent Test Suite')
  console.log('============================')
  console.log(`Mastra URL: ${MASTRA_URL}`)

  // Check if Mastra is running
  try {
    const health = await fetch(`${MASTRA_URL}/api/agents`)
    if (!health.ok) {
      console.log('\n❌ Mastra is not running. Start it with: pnpm dev')
      return
    }
    console.log('✅ Mastra is running\n')
  } catch {
    console.log('\n❌ Cannot connect to Mastra. Start it with: pnpm dev')
    return
  }

  // Run all test cases
  for (const testCase of testCases) {
    await testPredicateAgent(testCase)
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n============================')
  console.log('🏁 Test suite complete!')
}

main()
