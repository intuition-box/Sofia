declare module "~src/components/WalletConnectionButton" {
  const WalletConnectionButton: React.ComponentType
  export default WalletConnectionButton
}

declare module "~src/components/ui/button" {
  export const Button: React.ComponentType<any>
}

declare module "~src/lib/walletProvider" {
  export const getWalletProvider: () => Promise<any>
  export const cleanupProvider: () => void
}

declare module 'express' {
  const express: any;
  export default express;
}

declare module 'node-fetch' {
  const fetch: any;
  export default fetch;
}

// hooks/useLinkedWallets.ts is dead code (not imported anywhere) but still
// references @privy-io/react-auth, which the extension never installed —
// extension uses native Chrome wallet providers, Privy is explorer-only.
// Stub the module so typecheck doesn't break on the unused hook.
declare module '@privy-io/react-auth' {
  export const usePrivy: () => any;
  export const useWallets: () => any;
}

// Asset declarations
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}