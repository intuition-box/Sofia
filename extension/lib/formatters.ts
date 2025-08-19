/**
 * Fonctions utilitaires pour le formatage des données
 */

// Formater un timestamp en date lisible
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
  });
}

// Formater une durée en format lisible
export function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return hrs > 0 ? `${hrs}h ${remMin}m ${remSec}s` : `${min}m ${remSec}s`;
}

// Formater une URL pour l'affichage (enlever le protocole, raccourcir)
export function formatUrl(url: string, maxLength: number = 50): string {
  try {
    const urlObj = new URL(url);
    let formatted = urlObj.hostname + urlObj.pathname;
    
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
  }
}

// Formater un nombre en format lisible (K, M, etc.)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Formater une taille de fichier en format lisible
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}