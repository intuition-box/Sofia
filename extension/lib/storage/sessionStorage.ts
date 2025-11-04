import { Storage } from "@plasmohq/storage"

/**
 * Session Storage - Effacé automatiquement à la fermeture du navigateur
 * Utilise chrome.storage.session au lieu de chrome.storage.local
 *
 * Utilisé pour stocker l'adresse du wallet MetaMask pour que l'utilisateur
 * doive se reconnecter à chaque ouverture du navigateur
 */
export const sessionStorage = new Storage({ area: "session" })

/**
 * Clé pour l'adresse du wallet MetaMask dans le session storage
 */
export const METAMASK_ACCOUNT_KEY = "metamask-account"
