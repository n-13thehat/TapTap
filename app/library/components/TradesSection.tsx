import React from 'react';
import { History, TrendingUp, TrendingDown, Plus, Minus, X } from 'lucide-react';
import { Trade } from '../types';
import { timeAgo, cn } from '../utils';
import { Header } from './Header';
import { EmptyState } from './EmptyState';

interface TradeRowProps {
  trade: Trade;
}

function TradeRow({ trade }: TradeRowProps) {
  const getTypeIcon = () => {
    switch (trade.type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'mint':
        return <Plus className="h-4 w-4 text-blue-400" />;
      case 'list':
        return <Minus className="h-4 w-4 text-yellow-400" />;
      case 'cancel':
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return <History className="h-4 w-4 text-white/60" />;
    }
  };

  const getStatusColor = () => {
    switch (trade.status) {
      case 'complete':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 rounded-md px-3 py-2 hover:bg-white/5">
      <div className="flex items-center">
        {getTypeIcon()}
      </div>
      
      <div className="min-w-0">
        <div className="text-sm font-medium text-white capitalize">{trade.type}</div>
        <div className="text-xs text-white/60">{trade.unit}</div>
      </div>
      
      <div className="text-right">
        <div className="text-sm text-white">{trade.qty}</div>
        <div className="text-xs text-white/60">qty</div>
      </div>
      
      <div className="text-right">
        <div className="text-sm text-white">${(trade.price / 100).toFixed(2)}</div>
        <div className="text-xs text-white/60">TAP</div>
      </div>
      
      <div className="text-right">
        <div className={cn("text-sm font-medium capitalize", getStatusColor())}>
          {trade.status}
        </div>
        <div className="text-xs text-white/40">{timeAgo(trade.ts)}</div>
      </div>
    </div>
  );
}

interface TradesSectionProps {
  trades: Trade[];
}

export function TradesSection({ trades }: TradesSectionProps) {
  if (!trades.length) {
    return (
      <EmptyState
        title="No trading history"
        description="Your marketplace transactions and NFT trades will appear here."
        action={{ label: "Visit Marketplace", href: "/marketplace" }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <Header 
        icon={<History className="h-4 w-4 text-teal-300" />} 
        title="Trades" 
        subtitle={`${trades.length} transactions`} 
      />
      
      <div className="rounded-xl border border-white/10 bg-white/5">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-white/10 px-3 py-2 text-xs font-medium text-white/60">
          <div>Type</div>
          <div>Asset</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Price</div>
          <div className="text-right">Status</div>
        </div>
        
        {/* Trades */}
        <div className="space-y-1 p-2">
          {trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      </div>
    </section>
  );
}
