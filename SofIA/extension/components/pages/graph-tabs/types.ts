export interface Message {
  content: { text: string }
  created_at: number
}

export interface Triplet {
  subject: { name: string; description?: string; url?: string }
  predicate: { name: string; description?: string }
  object: { name: string; description?: string; url: string }
}

export interface ParsedSofiaMessage {
  triplets: Triplet[]
  intention: string
  created_at: number
}

export function parseSofiaMessage(text: string, created_at: number): ParsedSofiaMessage | null {
  console.log("🔍 Parsing message text:", text)

  try {
    // 🧼 Nettoyage avancé pour rendre le JSON valide
    let sanitized = text
      .replace(/[""]/g, '"')              // guillemets doubles typographiques
      .replace(/['']/g, "'")              // guillemets simples typographiques
      .replace(/([{,])\s*'([^']+?)'\s*:/g, '$1"$2":')    // 'clé': => "clé":
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // clé: => "clé":
      .replace(/:\s*'([^']*?)'/g, ': "$1"')               // 'valeur' => "valeur"

    console.log("🧼 Sanitized JSON string:", sanitized)

    const jsonData = JSON.parse(sanitized)

    const parsedTriplets: Triplet[] = (jsonData.triplets || []).map((t: any) => ({
      subject: {
        name: t.subject?.name || 'Unknown',
        description: t.subject?.description,
        url: t.subject?.url
      },
      predicate: {
        name: t.predicate?.name || 'did something',
        description: t.predicate?.description
      },
      object: {
        name: t.object?.name || 'Unknown',
        description: t.object?.description,
        url: t.object?.url || '#'
      }
    }))

    return {
      triplets: parsedTriplets,
      intention: jsonData.intention || '',
      created_at
    }
  } catch (error) {
    console.warn("❌ Failed to parse JSON, treating as text message:", error)

    if (text && typeof text === 'string' && text.trim().length > 0) {
      return {
        triplets: [],
        intention: text.trim(),
        created_at
      }
    }

    return null
  }
}