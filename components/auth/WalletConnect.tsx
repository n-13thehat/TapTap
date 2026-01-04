"use client";

import { useState } from 'react';
import { useWallet } from '@/hooks/useAuth';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2,
  AlertCircle,
  Shield,
  Coins,
  Zap
} from 'lucide-react';

interface WalletConnectProps {
  className?: string;
  showDetails?: boolean;
}

export default function WalletConnect({ 
  className = '', 
  showDetails = false 
}: WalletConnectProps) {
  const { address, isConnected, connecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      setError('');
      await connect();
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to disconnect wallet');
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connecting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Wallet size={20} />
          )}
          
          <div className="flex flex-col items-start">
            <span className="font-medium">
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </span>
            {showDetails && (
              <span className="text-xs opacity-75">
                Connect your crypto wallet
              </span>
            )}
          </div>
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {showDetails && !isConnected && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-white/80">Why Connect a Wallet?</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Coins size={14} className="text-yellow-400" />
                <span>Earn and spend TapCoins</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Shield size={14} className="text-green-400" />
                <span>Secure NFT storage</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Zap size={14} className="text-purple-400" />
                <span>Access premium features</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Connected Wallet Display */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300">Wallet Connected</span>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="text-xs text-white/60 hover:text-white/80 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-green-400" />
              <span className="text-sm text-white font-mono">
                {formatAddress(address!)}
              </span>
            </div>
            
            {showDetails && (
              <div className="text-xs text-white/60">
                Ethereum Mainnet
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyAddress}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Copy size={14} className="text-white/60" />
              )}
            </button>
            
            <button
              onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink size={14} className="text-white/60" />
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-3 border-t border-green-500/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">TapCoins</div>
                <div className="text-white font-medium">1,234.56</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">NFTs</div>
                <div className="text-white font-medium">7</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for navigation bars
 */
export function WalletConnectCompact({ className = '' }: { className?: string }) {
  const { address, isConnected, connecting, connect } = useWallet();

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className={`
          flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {connecting ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Wallet size={16} />
        )}
        <span className="text-sm font-medium">
          {connecting ? 'Connecting...' : 'Connect'}
        </span>
      </button>
    );
  }

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg
      ${className}
    `}>
      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      <span className="text-sm font-medium font-mono">
        {address!.slice(0, 6)}...{address!.slice(-4)}
      </span>
    </div>
  );
}
