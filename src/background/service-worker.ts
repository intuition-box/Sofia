// Service Worker pour Extension Chrome Manifest V3
console.log('SOFIA Extension Service Worker démarré')

// Listener pour l'installation de l'extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension SOFIA installée')
})

// Listener pour les messages du content script ou popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Message reçu:', message)
  sendResponse({ status: 'reçu' })
})

export {} 