export interface Message {
  content: { text: string }
  created_at: number
}

export interface Triplet {
  subject: string
  predicate: string
  object: string
}

export interface ParsedSofiaMessage {
  triplets: Triplet[]
  intention: string
  created_at: number
}

export function parseSofiaMessage(text: string, created_at: number): ParsedSofiaMessage | null {
  console.log("🔍 Parsing message text:", text)
  
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log("❌ Empty or invalid text")
    return null
  }

  try {
    // Try direct parsing first
    let jsonData = JSON.parse(text)
    
    const parsedTriplets: Triplet[] = (jsonData.triplets || []).map((t: any) => ({
      subject: typeof t.subject === 'string' ? t.subject : (t.subject?.name || 'Unknown'),
      predicate: typeof t.predicate === 'string' ? t.predicate : (t.predicate?.name || 'did something'), 
      object: typeof t.object === 'string' ? t.object : (t.object?.name || 'Unknown')
    }))

    return {
      triplets: parsedTriplets,
      intention: jsonData.intention || '',
      created_at
    }
  } catch (error) {
    // Try to fix common JSON issues from Eliza
    try {
      let sanitized = text
        // Fix the specific pattern from the logs: \"name\": \"value\" -> "name": "value"
        .replace(/\\"/g, '"')
        // Fix broken JSON structure patterns from the logs
        .replace(/]\s*,\s*\n\s*,\s*"/g, '],"')  // Fix "], \n," pattern
        .replace(/}\s*\n\s*,\s*"/g, '},"')      // Fix "} \n," pattern  
        .replace(/,\s*\n\s*,/g, ',')            // Fix ", \n," double comma
        // Fix trailing comma issues
        .replace(/,\s*\n\s*}/g, '}')
        .replace(/,\s*\n\s*]/g, ']')
        // Fix empty URL field specifically
        .replace(/"url":\s*""\s*}/g, '"url":""}')
        // Clean up whitespace and newlines
        .replace(/\n\s+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()

      console.log("🧼 Trying to sanitize JSON:", sanitized)
      
      const jsonData = JSON.parse(sanitized)
      
      const parsedTriplets: Triplet[] = (jsonData.triplets || []).map((t: any) => ({
        subject: typeof t.subject === 'string' ? t.subject : (t.subject?.name || 'Unknown'),
        predicate: typeof t.predicate === 'string' ? t.predicate : (t.predicate?.name || 'did something'), 
        object: typeof t.object === 'string' ? t.object : (t.object?.name || 'Unknown')
      }))

      return {
        triplets: parsedTriplets,
        intention: jsonData.intention || '',
        created_at
      }
    } catch (secondError) {
      console.log("✅ Both parsing attempts failed, treating as plain text intention")
      return {
        triplets: [],
        intention: text.trim(),
        created_at
      }
    }
  }
}