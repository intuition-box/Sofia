// Content Script pour Extension Chrome
console.log('SOFIA Extension Content Script chargé sur:', window.location.href);

// Capturer des événements de page pour enrichir l'historique
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    chrome.runtime.sendMessage({
      type: 'page-hidden',
      url: window.location.href,
      timestamp: Date.now(),
    });
  } else {
    chrome.runtime.sendMessage({
      type: 'page-visible',
      url: window.location.href,
      timestamp: Date.now(),
    });
  }
});

// Détecter l'activité utilisateur pour calculer l'engagement
let lastActivity = Date.now();

// Corriger la syntaxe des event listeners
const activityEvents: string[] = ['click', 'scroll', 'keypress'];
activityEvents.forEach((event: string) => {
  document.addEventListener(event, () => {
    lastActivity = Date.now();
  });
});

// Envoyer métriques d'engagement toutes les 30 secondes
setInterval(() => {
  const isActive = Date.now() - lastActivity < 30000; // Actif si action < 30s
  chrome.runtime.sendMessage({
    type: 'user-activity',
    url: window.location.href,
    isActive,
    timestamp: Date.now(),
  });
}, 30000);

export {};
