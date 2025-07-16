// Content script démarré

// Variables globales pour le suivi
let pageLoadTime = Date.now();
let isPageVisible = true;
let scrollCount = 0;

// Vérifier si on est dans un iframe indésirable
function shouldIgnoreFrame(): boolean {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  // Ignorer les iframes publicitaires et trackers
  const ignoredDomains = [
    'googletagmanager.com',
    'doubleclick.net',
    'amazon-adsystem.com',
    'google.com/recaptcha',
    'adtrafficquality.google',
    'contextual.media.net',
    'rubiconproject.com',
    'pubmatic.com',
    'jscache.com',
    'indexww.com',
    'a-mo.net',
    'casalemedia.com'
  ];
  
  // Ignorer si on est dans un iframe et que le domaine est dans la liste
  if (window !== window.top && ignoredDomains.some(domain => hostname.includes(domain))) {
    return true;
  }
  
  // Ignorer les URLs très longues (souvent des trackers)
  if (url.length > 200) {
    return true;
  }
  
  return false;
}

// Test de communication et extraction des données
function testAndExtractData() {
  // Vérifier si on doit ignorer ce frame
  if (shouldIgnoreFrame()) {
    return;
  }
  
  if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  // Test de communication rapide puis extraction
  chrome.runtime.sendMessage({
    type: 'TEST_MESSAGE',
    data: { url: window.location.href, title: document.title, timestamp: Date.now() }
  }).then(() => {
    setTimeout(extractRealData, 500);
  }).catch(() => {
    // Tentative directe si le test échoue
    setTimeout(extractRealData, 1000);
  });
}

// Extraction des données réelles
function extractRealData() {
  const title = document.title || '';
  const keywordsElement = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
  const keywords = keywordsElement?.content || '';
  const descriptionElement = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  const description = descriptionElement?.content || '';
  const ogTypeElement = document.querySelector('meta[property="og:type"]') as HTMLMetaElement;
  const ogType = ogTypeElement?.content || '';
  const h1Element = document.querySelector('h1');
  const h1 = h1Element?.textContent?.trim() || '';

  const pageData = {
    title,
    keywords,
    description,
    ogType,
    h1,
    url: window.location.href,
    timestamp: Date.now()
  };

  chrome.runtime.sendMessage({
    type: 'PAGE_DATA',
    data: pageData,
    pageLoadTime: Date.now()
  }).catch(() => {
    // Ignorer les erreurs silencieusement
  });
}

// Gérer la visibilité de la page pour calculer la durée
document.addEventListener('visibilitychange', () => {
  if (shouldIgnoreFrame()) return;
  
  if (document.visibilityState === 'hidden' && isPageVisible) {
    const duration = Date.now() - pageLoadTime;
    chrome.runtime.sendMessage({
      type: 'PAGE_DURATION',
      data: { url: window.location.href, duration, timestamp: Date.now() }
    }).catch(() => {});
    isPageVisible = false;
  } else if (document.visibilityState === 'visible' && !isPageVisible) {
    pageLoadTime = Date.now();
    isPageVisible = true;
  }
});

// Gestionnaire de scroll avec débounce et suivi avancé
let scrollTimeout: NodeJS.Timeout;
window.addEventListener('scroll', () => {
  // Ignorer le scroll dans les frames publicitaires
  if (shouldIgnoreFrame()) {
    return;
  }
  
  scrollCount++;
  clearTimeout(scrollTimeout);
  
  scrollTimeout = setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'SCROLL_DATA',
      data: {
        scrollY: window.scrollY,
        timestamp: Date.now(),
        url: window.location.href,
        scrollCount
      }
    }).catch(() => {});
  }, 100); // Débounce de 100ms
});

// Gérer les changements d'URL pour les SPAs
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (shouldIgnoreFrame()) return;
  
  if (window.location.href !== currentUrl) {
    const duration = Date.now() - pageLoadTime;
    chrome.runtime.sendMessage({
      type: 'PAGE_DURATION',
      data: { url: currentUrl, duration, timestamp: Date.now() }
    }).catch(() => {});
    
    currentUrl = window.location.href;
    pageLoadTime = Date.now();
    scrollCount = 0;
    setTimeout(testAndExtractData, 100);
  }
});

// Observer les changements seulement si on n'est pas dans un iframe à ignorer
if (!shouldIgnoreFrame() && document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Envoyer la durée quand la page se ferme
window.addEventListener('beforeunload', () => {
  if (shouldIgnoreFrame()) return;
  
  const duration = Date.now() - pageLoadTime;
  chrome.runtime.sendMessage({
    type: 'PAGE_DURATION',
    data: { url: window.location.href, duration, timestamp: Date.now() }
  }).catch(() => {});
});

// Démarrage

// Attendre que la page soit prête
function startWhenReady() {
  // Ne pas démarrer si on doit ignorer ce frame
  if (shouldIgnoreFrame()) {
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testAndExtractData, 100);
    });
  } else {
    setTimeout(testAndExtractData, 100);
  }
}

startWhenReady();

// SOFIA initialisé
