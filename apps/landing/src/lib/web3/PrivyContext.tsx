import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PrivyProvider, usePrivy, useLogin, useLogout } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? 'cmj05tjsj03thjs0c3mgxrixm';
const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID ?? 'client-WY6U3b3LFEgbveR2FVgiyTTbRWKCZhy6vEVFzQt9NvZYS';

interface WalletContextValue {
  address: string | null;
  walletType: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
}

const defaultValue: WalletContextValue = {
  address: null,
  walletType: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
  clearError: () => {},
};

const WalletContext = createContext<WalletContextValue>(defaultValue);

const getWalletInfo = (user: any): { address: string | null; walletType: string | null } => {
  if (!user) return { address: null, walletType: null };
  const walletAccount = user.linkedAccounts?.find((a: any) => a.type === 'wallet');
  if (walletAccount?.address) return { address: walletAccount.address, walletType: walletAccount.walletClientType || null };
  if (user.wallet?.address) return { address: user.wallet.address, walletType: user.wallet.walletClientType || null };
  return { address: null, walletType: null };
};

function InnerProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const { logout } = useLogout();
  const [state, setState] = useState({
    address: null as string | null,
    walletType: null as string | null,
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
  });

  const { login } = useLogin({
    onComplete: ({ user: u }: { user: any }) => {
      const { address, walletType } = getWalletInfo(u);
      setState({ address, walletType, isConnected: !!address, isConnecting: false, error: address ? null : 'No wallet found.' });
    },
    onError: () => {
      setState(prev => ({ ...prev, isConnecting: false, error: 'Connection failed.' }));
    },
  });

  useEffect(() => {
    if (!ready) return;
    if (authenticated && user) {
      const { address, walletType } = getWalletInfo(user);
      if (address) setState({ address, walletType, isConnected: true, isConnecting: false, error: null });
    } else {
      setState({ address: null, walletType: null, isConnected: false, isConnecting: false, error: null });
    }
  }, [ready, authenticated, user]);

  const connect = useCallback(() => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    login();
  }, [login]);

  const disconnect = useCallback(async () => {
    await logout();
    setState({ address: null, walletType: null, isConnected: false, isConnecting: false, error: null });
  }, [logout]);

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, clearError }}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        appearance: { theme: 'dark', accentColor: '#ffffff' },
        loginMethods: ['wallet'],
      }}
    >
      <InnerProvider>{children}</InnerProvider>
    </PrivyProvider>
  );
}

export function useWalletConnection() {
  return useContext(WalletContext);
}
