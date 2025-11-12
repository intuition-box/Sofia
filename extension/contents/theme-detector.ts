// theme-detector.ts - Content script to detect Chrome theme
// This runs in actual web pages which DO reflect the Chrome theme

export {};

function detectAndSendTheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  chrome.runtime.sendMessage({
    type: 'PAGE_THEME_DETECTED',
    theme: isDark ? 'dark' : 'light'
  }).catch(() => {});
}

detectAndSendTheme();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectAndSendTheme);
