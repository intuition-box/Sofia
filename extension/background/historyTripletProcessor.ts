/**
 * History-specific triplet processor
 * Converts History Analysis themes to the exact format EchoesTab expects
 */

// Function to convert history themes to triplets (compatible with EchoesTab)
export function convertHistoryThemesToTriplets(themes: any[]): any {
  console.log('🔧 Converting history themes to triplets:', themes.length, 'themes')
  
  const triplets = themes.map((theme, index) => {
    // For history analysis: use predicate and object directly
    let predicate = theme.predicate
    let objectName = theme.object // History themes have object field
    let firstUrl = theme.urls?.[0] || ""
    
    console.log(`🔧 History Theme ${index}: predicate="${predicate}", object="${objectName}" -> URL: ${firstUrl}`)
    
    return {
      subject: "User",
      predicate: predicate,
      object: objectName,
      objectUrl: firstUrl
    }
  })
  
  return { triplets }
}