// offscreen.js - Theme detection for extension icon
// This script runs in an offscreen document to access matchMedia API

function detectTheme() {
  // Try media query first
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let isDark = darkModeQuery.matches;

  // Fallback: detect from background color (for WSL/Linux where media query fails)
  if (!isDark) {
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      isDark = luminance < 0.5;
    }
  }

  return isDark ? 'dark' : 'light';
}

// Send initial theme to background
chrome.runtime.sendMessage({
  type: 'THEME_DETECTED',
  theme: detectTheme()
}).catch(() => {});

// Listen for theme changes via media query
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

darkModeQuery.addEventListener('change', (e) => {
  chrome.runtime.sendMessage({
    type: 'THEME_CHANGED',
    theme: e.matches ? 'dark' : 'light'
  }).catch(() => {});
});

// Fallback: Poll for theme changes (for WSL/Linux where media query doesn't work)
let lastDetectedTheme = detectTheme();

setInterval(() => {
  const currentTheme = detectTheme();
  if (currentTheme !== lastDetectedTheme) {
    lastDetectedTheme = currentTheme;
    chrome.runtime.sendMessage({
      type: 'THEME_CHANGED',
      theme: currentTheme
    }).catch(() => {});
  }
}, 1000);
