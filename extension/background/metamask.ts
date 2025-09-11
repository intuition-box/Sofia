import type { MetaMaskConnection } from "~types/wallet";

let metamaskConnection: MetaMaskConnection | null = null;

export async function connectToMetamask(): Promise<MetaMaskConnection> {
  try {
    if (metamaskConnection?.account) {
      console.log('Background: Existing MetaMask connection found');
      return metamaskConnection;
    }

    throw new Error('MetaMask connection must be handled by UI component');

  } catch (error) {
    console.error('Background: Error connecting to MetaMask:', error);
    throw error;
  }
}

export function getMetamaskConnection(): MetaMaskConnection | null {
  return metamaskConnection;
}

export function setMetamaskConnection(connection: MetaMaskConnection | null): void {
  metamaskConnection = connection;
}