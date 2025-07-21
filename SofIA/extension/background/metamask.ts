import type { MetaMaskConnection } from "~types/wallet";

let metamaskConnection: MetaMaskConnection | null = null;

export async function connectToMetamask(): Promise<MetaMaskConnection> {
  try {
    if (metamaskConnection?.account) {
      console.log('Background: Connexion MetaMask existante trouvée');
      return metamaskConnection;
    }

    throw new Error('Connexion MetaMask doit être gérée par le composant UI');

  } catch (error) {
    console.error('Background: Erreur lors de la connexion MetaMask:', error);
    throw error;
  }
}

export function getMetamaskConnection(): MetaMaskConnection | null {
  return metamaskConnection;
}

export function setMetamaskConnection(connection: MetaMaskConnection | null): void {
  metamaskConnection = connection;
}