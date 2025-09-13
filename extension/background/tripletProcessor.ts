import { elizaDataService } from "../lib/database/indexedDB-methods"

// Function to convert themes directly to triplets
export function convertThemesToTriplets(themes: any[]): any {
  console.log('🔧 Converting themes to triplets:', themes.length, 'themes')
  
  const triplets = themes.map((theme, index) => {
    // Use the predicate and object directly from theme (already in correct format)
    let predicate = theme.predicate
    let objectName = theme.object || theme.name // Use object field if available, fallback to name
    let firstUrl = theme.urls?.[0] || ""
    
    console.log(`🔧 Theme ${index}: ${theme.name} -> URL: ${firstUrl}`)
    
    return {
      subject: {
        name: "User",
        description: "Sofia's user", 
        url: "https://github.com/intuition-box/Sofia"
      },
      predicate: {
        name: predicate,
        description: `${theme.category} relationship`
      },
      object: {
        name: objectName,
        description: `${theme.keywords?.join(', ') || theme.name}`,
        url: firstUrl
      }
    }
  })
  
  return { triplets }
}

// Unified function to process URLs with theme analysis
export async function processUrlsWithThemeAnalysis(
  urls: string[], 
  type: 'bookmark' | 'history',
  extractorFunction: Function,
  successMessage: string
): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  console.log(`🔄 Starting ${type} processing pipeline:`, urls.length, 'URLs')
  
  try {
    // Step 1: Extract themes
    console.log(`🎨 Step 1: Extracting themes from ${type}...`)
    const themeResult = await extractorFunction(urls)
    
    if (!themeResult.success) {
      return {
        success: false,
        message: `Theme extraction failed: ${themeResult.message}`,
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    console.log(`✅ Themes extracted from ${type}:`, themeResult.themes.length)
    
    if (themeResult.themes.length === 0) {
      return {
        success: true,
        message: `No themes extracted from ${type}`,
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    // Step 2: Convert themes to triplets
    console.log(`📚 Step 2: Converting ${type} themes to triplets...`, themeResult.themes.length, 'themes')
    
    const tripletData = convertThemesToTriplets(themeResult.themes)
    console.log(`📚 Generated triplets from ${type}:`, tripletData.triplets.length)
    
    // Step 3: Store triplets in IndexedDB
    try {
      const newMessage = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: JSON.stringify(tripletData) }, // Store with {triplets: [...]} wrapper
        created_at: Date.now(),
        processed: false
      }
      
      await elizaDataService.storeMessage(newMessage, newMessage.id)
      console.log(`✅ ${type} triplets stored in IndexedDB:`, newMessage.id)
      console.log(`🔍 Stored message content:`, newMessage.content.text)
      
      return {
        success: true,
        message: `${successMessage}: ${themeResult.themes.length} themes extracted, ${tripletData.triplets.length} triplets created`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: true
      }
    } catch (error) {
      console.error(`❌ Failed to store ${type} triplets:`, error)
      return {
        success: false,
        message: `${type} pipeline failed: ${error.message}`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: false
      }
    }

  } catch (error) {
    console.error(`❌ ${type} pipeline processing failed:`, error)
    return {
      success: false,
      message: `${type} pipeline failed: ${error.message}`,
      themesExtracted: 0,
      triplesProcessed: false
    }
  }
}