"use client";

import { useOutbox } from '@/hooks/useSocial';
import { 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  X,
  Trash2,
  Info
} from 'lucide-react';

interface OutboxStatusProps {
  detailed?: boolean;
}

export default function OutboxStatus({ detailed = false }: OutboxStatusProps) {
  const { 
    status, 
    isRetrying, 
    retry, 
    clear, 
    hasFailedItems, 
    hasPendingItems 
  } = useOutbox();

  if (!detailed && !hasFailedItems && !hasPendingItems) {
    return null;
  }

  const getStatusColor = () => {
    if (hasFailedItems) return 'border-red-500/30 bg-red-500/10';
    if (hasPendingItems) return 'border-yellow-500/30 bg-yellow-500/10';
    return 'border-green-500/30 bg-green-500/10';
  };

  const getStatusIcon = () => {
    if (hasFailedItems) return <AlertTriangle size={20} className="text-red-400" />;
    if (hasPendingItems) return <Clock size={20} className="text-yellow-400" />;
    return <CheckCircle size={20} className="text-green-400" />;
  };

  const getStatusMessage = () => {
    if (hasFailedItems) {
      return `${status.failed} post${status.failed > 1 ? 's' : ''} failed to send`;
    }
    if (hasPendingItems) {
      return `${status.pending + status.sending} post${status.pending + status.sending > 1 ? 's' : ''} pending`;
    }
    return 'All posts sent successfully';
  };

  if (!detailed) {
    return (
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="font-medium text-white">{getStatusMessage()}</div>
              <div className="text-sm text-white/60">
                {hasFailedItems && 'Posts will be retried automatically'}
                {hasPendingItems && 'Posts are being sent in the background'}
                {!hasFailedItems && !hasPendingItems && 'Outbox is clear'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasFailedItems && (
              <button
                onClick={retry}
                disabled={isRetrying}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1 rounded text-sm transition-colors"
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying...' : 'Retry Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Send size={24} className="text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Outbox Status</h3>
              <p className="text-white/60 text-sm">
                Reliable post delivery with automatic retry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status.total > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors"
              >
                <Trash2 size={14} />
                Clear Sent
              </button>
            )}
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock size={20} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{status.pending}</div>
            <div className="text-sm text-white/60">Pending</div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Send size={20} className="text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{status.sending}</div>
            <div className="text-sm text-white/60">Sending</div>
          </div>

          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{status.failed}</div>
            <div className="text-sm text-white/60">Failed</div>
          </div>

          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {status.total - status.pending - status.sending - status.failed}
            </div>
            <div className="text-sm text-white/60">Sent</div>
          </div>
        </div>

        {/* Actions */}
        {(hasFailedItems || hasPendingItems) && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="text-sm text-white/80">
              {hasFailedItems && 'Failed posts will be retried automatically with exponential backoff.'}
              {!hasFailedItems && hasPendingItems && 'Posts are being processed in the background.'}
            </div>

            <div className="flex items-center gap-2">
              {hasFailedItems && (
                <button
                  onClick={retry}
                  disabled={isRetrying}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
                  {isRetrying ? 'Retrying...' : 'Retry Failed'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} className="text-blue-400" />
          <h4 className="font-medium text-white">How Outbox Works</h4>
        </div>
        
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              1
            </div>
            <div>
              <div className="font-medium text-white">Reliable Queuing</div>
              <div>Posts are queued locally before sending to ensure no data loss</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              2
            </div>
            <div>
              <div className="font-medium text-white">Automatic Retry</div>
              <div>Failed posts are automatically retried with exponential backoff</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              3
            </div>
            <div>
              <div className="font-medium text-white">Background Processing</div>
              <div>Posts are sent in the background without blocking the UI</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
              4
            </div>
            <div>
              <div className="font-medium text-white">Offline Support</div>
              <div>Posts are queued when offline and sent when connection is restored</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
