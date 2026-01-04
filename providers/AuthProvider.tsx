"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';

interface AuthContextType {
  user: any;
  loading: boolean;
  isCreatorMode: boolean;
  toggleCreatorMode: () => void;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  twoFactorEnabled: boolean;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  session?: any;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  const [user, setUser] = useState(session?.user || null);
  const [loading, setLoading] = useState(false); // Start with false to prevent SSR mismatch
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hydration check
  useEffect(() => {
    setIsClient(true);
    setLoading(!session);
  }, [session]);

  // Load user preferences from localStorage
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const savedCreatorMode = localStorage.getItem('taptap_creator_mode') === 'true';
      const savedWalletAddress = localStorage.getItem('taptap_wallet_address');
      const saved2FA = localStorage.getItem('taptap_2fa_enabled') === 'true';

      setIsCreatorMode(savedCreatorMode);
      setWalletAddress(savedWalletAddress);
      setTwoFactorEnabled(saved2FA);
    }
  }, [isClient]);

  // Creator mode toggle
  const toggleCreatorMode = () => {
    const newMode = !isCreatorMode;
    setIsCreatorMode(newMode);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('taptap_creator_mode', newMode.toString());
      
      // Emit event for other components to react
      window.dispatchEvent(new CustomEvent('taptap:creator-mode-changed', {
        detail: { enabled: newMode }
      }));
    }
  };

  // Wallet connection (simplified for demo - would integrate with actual wallet providers)
  const connectWallet = async () => {
    try {
      // Simulate wallet connection
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          localStorage.setItem('taptap_wallet_address', address);
          
          // Emit wallet connected event
          window.dispatchEvent(new CustomEvent('taptap:wallet-connected', {
            detail: { address }
          }));
        }
      } else {
        // Fallback for demo purposes
        const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
        setWalletAddress(mockAddress);
        localStorage.setItem('taptap_wallet_address', mockAddress);
        
        console.log('Demo wallet connected:', mockAddress);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taptap_wallet_address');
      
      // Emit wallet disconnected event
      window.dispatchEvent(new CustomEvent('taptap:wallet-disconnected'));
    }
  };

  // Two-factor authentication
  const enableTwoFactor = async () => {
    try {
      // In a real implementation, this would:
      // 1. Generate QR code for authenticator app
      // 2. Verify setup with user
      // 3. Store backup codes
      // 4. Enable 2FA on server
      
      setTwoFactorEnabled(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('taptap_2fa_enabled', 'true');
        
        // Emit 2FA enabled event
        window.dispatchEvent(new CustomEvent('taptap:2fa-enabled'));
      }
      
      console.log('2FA enabled (demo)');
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setTwoFactorEnabled(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('taptap_2fa_enabled', 'false');
        
        // Emit 2FA disabled event
        window.dispatchEvent(new CustomEvent('taptap:2fa-disabled'));
      }
      
      console.log('2FA disabled (demo)');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    isCreatorMode,
    toggleCreatorMode,
    walletAddress,
    connectWallet,
    disconnectWallet,
    twoFactorEnabled,
    enableTwoFactor,
    disableTwoFactor
  };

  // Prevent SSR mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <SessionProvider session={session}>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
