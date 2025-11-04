import { useStorage } from "@plasmohq/storage/hook"
import { sessionStorage, METAMASK_ACCOUNT_KEY } from "../lib/storage/sessionStorage"

/**
 * Hook pour accéder à l'adresse du wallet MetaMask
 *
 * Utilise le session storage qui est automatiquement effacé à la fermeture du navigateur,
 * forçant ainsi l'utilisateur à se reconnecter à chaque nouvelle session.
 *
 * @returns [account, setAccount] - L'adresse du wallet et la fonction pour la modifier
 */
export const useMetamaskAccount = () => {
  return useStorage<string>({
    key: METAMASK_ACCOUNT_KEY,
    instance: sessionStorage
  })
}
