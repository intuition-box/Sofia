import React from 'react';
import { WalletProvider } from '@site/src/lib/web3/PrivyContext';

export default function Root({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
