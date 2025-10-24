import { createAvatar } from '@dicebear/core'
import { glass } from '@dicebear/collection'

/**
 * Vérifie si une URL est valide pour une image
 * N'accepte que HTTP et HTTPS
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Vérifie si une valeur est une adresse Ethereum
 * Format: 0x + 40 caractères hexadécimaux
 */
export function isEthereumAddress(value: string | undefined | null): boolean {
  if (!value) return false
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

/**
 * Détermine si on doit afficher un avatar DiceBear
 * Vrai pour les adresses Ethereum ou toute chaîne valide
 */
export function shouldShowDiceBearAvatar(
  value: string | undefined | null
): boolean {
  if (!value) return false
  return isEthereumAddress(value) || value.length > 0
}

/**
 * Génère un avatar DiceBear à partir d'une seed (adresse ou nom)
 * Retourne un Data URI directement utilisable dans une balise img
 */
export function generateDiceBearAvatar(seed: string): string {
  const avatar = createAvatar(glass, {
    seed: seed || 'unknown',
  })
  return avatar.toDataUri()
}

/**
 * Échappe les caractères spéciaux d'un Data URI SVG pour utilisation en CSS
 */
export function escapeSvgForCss(uri: string): string {
  return uri
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/#/g, '%23')
}

/**
 * Obtient les initiales d'un nom ou d'une adresse
 * Exemple: "vitalik.eth" → "V" / "0x1234..." → "0x"
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return '?'
  if (isEthereumAddress(name)) return '0x'
  const parts = name.split(/[\s._-]+/)
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}
