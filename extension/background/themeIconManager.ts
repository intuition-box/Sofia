// themeIconManager.ts - Manages extension icon based on system theme

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Icon paths for different themes (relative to extension root)
const ICON_PATHS = {
  light: {
    16: 'icon-light-16.png',
    32: 'icon-light-32.png',
    48: 'icon-light-48.png',
    64: 'icon-light-64.png',
    128: 'icon-light-128.png'
  },
  dark: {
    16: 'icon-dark-16.png',
    32: 'icon-dark-32.png',
    48: 'icon-dark-48.png',
    64: 'icon-dark-64.png',
    128: 'icon-dark-128.png'
  }
};

/**
 * Updates the extension icon based on the theme
 */
export async function updateIconForTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    const iconPaths = ICON_PATHS[theme];

    const iconUrls = {
      '16': chrome.runtime.getURL(iconPaths[16]),
      '32': chrome.runtime.getURL(iconPaths[32]),
      '48': chrome.runtime.getURL(iconPaths[48]),
      '64': chrome.runtime.getURL(iconPaths[64]),
      '128': chrome.runtime.getURL(iconPaths[128])
    };

    await chrome.action.setIcon({
      path: iconUrls as any
    });
  } catch (error) {
    console.error('Failed to update extension icon:', error);
  }
}

/**
 * Checks if offscreen document exists
 */
async function hasOffscreenDocument(): Promise<boolean> {
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
    return contexts.length > 0;
  }
  return false;
}

/**
 * Creates the offscreen document for theme detection
 */
async function createOffscreenDocument(): Promise<void> {
  const exists = await hasOffscreenDocument();

  if (exists) {
    try {
      await chrome.offscreen.closeDocument();
    } catch (error) {
      // Ignore errors
    }
  }

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['MATCH_MEDIA' as chrome.offscreen.Reason],
      justification: 'Detect system theme (light/dark mode) to update extension icon'
    });
  } catch (error) {
    console.error('Failed to create offscreen document:', error);
  }
}

/**
 * Handles theme detection and change messages from offscreen document and content scripts
 */
function setupThemeMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'THEME_DETECTED' || message.type === 'THEME_CHANGED' || message.type === 'PAGE_THEME_DETECTED') {
      const theme = message.theme as 'light' | 'dark';
      updateIconForTheme(theme);
    }
  });
}

/**
 * Initializes theme-aware icon system
 */
export async function initializeThemeIconManager(): Promise<void> {
  try {
    setupThemeMessageHandler();
    await createOffscreenDocument();
  } catch (error) {
    console.error('Failed to initialize theme icon manager:', error);
  }
}
