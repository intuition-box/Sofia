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
  rawObjectUrl?: string  // Keep the original URL for atom creation
  rawObjectDescription?: string  // Keep the original description for atom creation
  extractedAt?: number  // Timestamp when triplets were extracted and stored
  sourceMessageId?: string  // ID of the source message
}

export function parseSofiaMessage(text: string, created_at: number): ParsedSofiaMessage | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
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

    // Extract URL and description from first triplet object for atom creation
    const firstTriplet = jsonData.triplets?.[0]
    const rawObjectUrl = firstTriplet?.object?.url || ''
    const rawObjectDescription = firstTriplet?.object?.description || ''

    return {
      triplets: parsedTriplets,
      intention: jsonData.intention || '',
      created_at,
      rawObjectUrl,
      rawObjectDescription
    }
  } catch (error) {
    // Try to extract JSON structure manually from broken Eliza output
    try {
      // Extract triplets section
      const tripletMatch = text.match(/"triplets"\s*:\s*\[(.*?)\]/s)
      const intentionMatch = text.match(/"intention"\s*:\s*"([^"]*)"/)
      
      let parsedTriplets: Triplet[] = []
      let rawObjectUrl = ''
      let rawObjectDescription = ''
      
      if (tripletMatch) {
        const tripletText = tripletMatch[1]
        // Look for subject/predicate/object patterns
        const subjectMatch = tripletText.match(/"subject"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]*)"/)
        const predicateMatch = tripletText.match(/"predicate"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]*)"/)
        const objectMatch = tripletText.match(/"object"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]*)"/)
        
        // Extract URL and description from object
        const urlMatch = tripletText.match(/"object"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]*)"/)
        const descriptionMatch = tripletText.match(/"object"\s*:\s*\{[^}]*"description"\s*:\s*"([^"]*)"/)
        rawObjectUrl = urlMatch ? urlMatch[1] : ''
        rawObjectDescription = descriptionMatch ? descriptionMatch[1] : ''
        
        if (subjectMatch && predicateMatch && objectMatch) {
          parsedTriplets = [{
            subject: subjectMatch[1],
            predicate: predicateMatch[1],
            object: objectMatch[1]
          }]
        }
      }
      
      return {
        triplets: parsedTriplets,
        intention: intentionMatch ? intentionMatch[1] : '',
        created_at,
        rawObjectUrl,
        rawObjectDescription
      }
    } catch (extractError) {
      return {
        triplets: [],
        intention: text.trim(),
        created_at
      }
    }
  }
}