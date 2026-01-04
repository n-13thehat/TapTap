"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuthContext } from '@/providers/AuthProvider';
import { useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  role: 'LISTENER' | 'CREATOR' | 'ADMIN';
  walletAddress?: string;
  twoFactorEnabled?: boolean;
  creatorMode?: boolean;
  provider?: string;
  image?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  hasWallet: boolean;
  has2FA: boolean;
}

export interface AuthActions {
  signIn: (provider?: string, options?: any) => Promise<void>;
  signOut: () => Promise<void>;
  toggleCreatorMode: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const { data: session, status } = useSession();
  const authContext = useAuthContext();
  const [updating, setUpdating] = useState(false);

  const user = session?.user as AuthUser | null;
  const loading = status === 'loading' || updating;
  const isAuthenticated = !!user;
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN' || authContext.isCreatorMode;
  const isAdmin = user?.role === 'ADMIN';
  const hasWallet = !!authContext.walletAddress;
  const has2FA = authContext.twoFactorEnabled;

  const handleSignIn = useCallback(async (provider = 'credentials', options = {}) => {
    try {
      setUpdating(true);
      await signIn(provider, {
        callbackUrl: '/',
        ...options
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setUpdating(true);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taptap_creator_mode');
        localStorage.removeItem('taptap_wallet_address');
        localStorage.removeItem('taptap_2fa_enabled');
      }
      
      // Disconnect wallet
      authContext.disconnectWallet();
      
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [authContext]);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    try {
      setUpdating(true);
      
      // In a real implementation, this would call an API endpoint
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Trigger session refresh
      window.location.reload();
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    // State
    user,
    loading,
    isAuthenticated,
    isCreator,
    isAdmin,
    hasWallet,
    has2FA,
    
    // Actions
    signIn: handleSignIn,
    signOut: handleSignOut,
    toggleCreatorMode: authContext.toggleCreatorMode,
    connectWallet: authContext.connectWallet,
    disconnectWallet: authContext.disconnectWallet,
    enableTwoFactor: authContext.enableTwoFactor,
    disableTwoFactor: authContext.disableTwoFactor,
    updateProfile,
  };
}

/**
 * Hook for checking specific permissions
 */
export function usePermissions() {
  const { user, isCreator, isAdmin } = useAuth();
  
  return {
    canCreateContent: isCreator || isAdmin,
    canModerate: isAdmin,
    canAccessCreatorTools: isCreator || isAdmin,
    canManageUsers: isAdmin,
    canAccessBetaFeatures: user?.role !== 'LISTENER',
    canUploadTracks: isCreator || isAdmin,
    canCreateBattles: isCreator || isAdmin,
    canGoLive: isCreator || isAdmin,
    canAccessAnalytics: isCreator || isAdmin,
  };
}

/**
 * Hook for wallet-specific functionality
 */
export function useWallet() {
  const { walletAddress, connectWallet, disconnectWallet } = useAuthContext();
  const [connecting, setConnecting] = useState(false);
  
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      await connectWallet();
    } finally {
      setConnecting(false);
    }
  }, [connectWallet]);
  
  return {
    address: walletAddress,
    isConnected: !!walletAddress,
    connecting,
    connect,
    disconnect: disconnectWallet,
  };
}
