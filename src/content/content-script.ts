// Content Script pour Extension Chrome
console.log('SOFIA Extension Content Script chargé')

// Communication avec le service worker
chrome.runtime.sendMessage({ type: 'content-script-loaded' })

export {} 