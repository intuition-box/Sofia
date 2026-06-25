declare module "~src/components/WalletConnectionButton" {
  const WalletConnectionButton: React.ComponentType
  export default WalletConnectionButton
}

// Plasmo inline-text import (CSUI styles injected into the shadow DOM).
declare module "data-text:*" {
  const content: string;
  export default content;
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