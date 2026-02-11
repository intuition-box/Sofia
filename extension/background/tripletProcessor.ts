import { tripletsDataService } from "../lib/database"
import { createServiceLogger } from '../lib/utils/logger'

const logger = createServiceLogger('TripletProcessor')

// Function to convert themes directly to triplets
export function convertThemesToTriplets(themes: any[]): any {
  logger.info('Converting themes to triplets', { count: themes.length })
  
  const triplets = themes.map((theme, index) => {
    // Use the predicate and object directly from theme (already in correct format)
    let predicate = theme.predicate
    let objectName = theme.object || theme.name // Use object field if available, fallback to name
    let firstUrl = theme.urls?.[0] || ""
    
    logger.debug(`Theme ${index}: ${theme.name}`, { url: firstUrl })
    
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
  idPrefix: string,
  successMessage: string
): Promise<{success: boolean, message: string, themesExtracted: number, triplesProcessed: boolean}> {
  logger.info(`Starting ${type} processing pipeline`, { urlCount: urls.length })
  
  try {
    // Step 1: Extract themes
    logger.debug(`Step 1: Extracting themes from ${type}`)
    const themeResult = await extractorFunction(urls)
    
    if (!themeResult.success) {
      return {
        success: false,
        message: `Theme extraction failed: ${themeResult.message}`,
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    logger.info(`Themes extracted from ${type}`, { count: themeResult.themes.length })
    
    if (themeResult.themes.length === 0) {
      return {
        success: true,
        message: `No themes extracted from ${type}`,
        themesExtracted: 0,
        triplesProcessed: false
      }
    }

    // Step 2: Convert themes to triplets
    logger.debug(`Step 2: Converting ${type} themes to Signals`, { count: themeResult.themes.length })
    
    const tripletData = convertThemesToTriplets(themeResult.themes)
    logger.info(`Generated triplets from ${type}`, { count: tripletData.triplets.length })
    
    // Step 3: Store triplets in IndexedDB
    try {
      const newMessage = {
        id: `${idPrefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: { text: JSON.stringify(tripletData) }, // Store with {triplets: [...]} wrapper
        created_at: Date.now(),
        processed: false
      }
      
      await tripletsDataService.storeMessage(newMessage, newMessage.id)
      logger.info(`${type} triplets stored in IndexedDB`, { id: newMessage.id })
      logger.debug('Stored message content', { content: newMessage.content.text })
      
      return {
        success: true,
        message: `${successMessage}: ${themeResult.themes.length} themes extracted, ${tripletData.triplets.length} triplets created`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: true
      }
    } catch (error) {
      logger.error(`Failed to store ${type} triplets`, error)
      return {
        success: false,
        message: `${type} pipeline failed: ${error.message}`,
        themesExtracted: themeResult.themes.length,
        triplesProcessed: false
      }
    }

  } catch (error) {
    logger.error(`${type} pipeline processing failed`, error)
    return {
      success: false,
      message: `${type} pipeline failed: ${error.message}`,
      themesExtracted: 0,
      triplesProcessed: false
    }
  }
}