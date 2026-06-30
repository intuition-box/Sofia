declare module "~src/components/WalletConnectionButton" {
  const WalletConnectionButton: React.ComponentType
  export default WalletConnectionButton
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

// Plasmo content-script inline-asset imports (.plasmo/index.d.ts is gitignored,
// so declare them here for `bun run typecheck` in CI). data-base64:*.png already
// resolves via the "*.png" rule above; data-text has no such fallback.
declare module "data-text:*" {
  const content: string;
  export default content;
}

declare module "data-base64:*" {
  const content: string;
  export default content;
}