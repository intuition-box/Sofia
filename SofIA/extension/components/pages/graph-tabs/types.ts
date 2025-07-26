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
  console.log("📊 Text length:", text.length)
  console.log("📝 Text type:", typeof text)
  
  // Log des premiers et derniers caractères pour diagnostiquer
  if (text.length > 0) {
    console.log("🎯 First 100 chars:", text.substring(0, 100))
    console.log("🎯 Last 100 chars:", text.substring(Math.max(0, text.length - 100)))
    
    // Log autour de la position 577 si le texte est assez long
    if (text.length > 577) {
      console.log("🔍 Around position 577 (±50 chars):", text.substring(527, 627))
    }
  }

  let sanitized = ""
  try {
    // 🧼 Nettoyage avancé pour rendre le JSON valide
    sanitized = text
      .replace(/[""]/g, '"')              // guillemets doubles typographiques
      .replace(/['']/g, "'")              // guillemets simples typographiques
      .replace(/([{,])\s*'([^']+?)'\s*:/g, '$1"$2":')    // 'clé': => "clé":
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // clé: => "clé":
      .replace(/:\s*'([^']*?)'/g, ': "$1"')               // 'valeur' => "valeur"

    console.log("🧼 Sanitized JSON string:", sanitized)
    console.log("📊 Sanitized length:", sanitized.length)

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
    console.error("❌ Failed to parse JSON, treating as text message:", error)
    console.error("🔍 Original text that failed:", text)
    console.error("🧼 Sanitized text that failed:", sanitized)
    
    // Log détaillé de l'erreur de parsing
    if (error instanceof SyntaxError) {
      console.error("📍 Syntax error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    }

    if (text && typeof text === 'string' && text.trim().length > 0) {
      console.log("✅ Returning as plain text intention")
      return {
        triplets: [],
        intention: text.trim(),
        created_at
      }
    }

    console.log("❌ Returning null - empty or invalid text")
    return null
  }
}