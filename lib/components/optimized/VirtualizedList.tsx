/**
 * Virtualized List component for rendering large datasets efficiently
 */

import React, { memo, forwardRef, useCallback, useMemo } from 'react';
import { useVirtualization, useInfiniteVirtualization } from '@/lib/hooks/useVirtualization';
import { cn } from '@/lib/utils';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  onScroll?: (scrollTop: number) => void;
  scrollElement?: HTMLElement | null;
  emptyComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  loading?: boolean;
}

const VirtualizedList = memo(forwardRef<HTMLDivElement, VirtualizedListProps<any>>(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor = (_, index) => index,
  overscan = 5,
  className,
  itemClassName,
  onScroll,
  scrollElement,
  emptyComponent: EmptyComponent,
  loadingComponent: LoadingComponent,
  loading = false,
}, ref) => {
  const { virtualItems, totalSize } = useVirtualization(items.length, {
    itemHeight,
    containerHeight,
    overscan,
    scrollElement,
  });

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(event.currentTarget.scrollTop);
  }, [onScroll]);

  // Render empty state
  if (!loading && items.length === 0) {
    return EmptyComponent ? <EmptyComponent /> : (
      <div className={cn('flex items-center justify-center h-full text-gray-500', className)}>
        No items to display
      </div>
    );
  }

  // Render loading state
  if (loading && items.length === 0) {
    return LoadingComponent ? <LoadingComponent /> : (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={keyExtractor(item, virtualItem.index)}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: virtualItem.start,
                left: 0,
                right: 0,
                height: virtualItem.size,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}));

VirtualizedList.displayName = 'VirtualizedList';

export interface InfiniteVirtualizedListProps<T> extends Omit<VirtualizedListProps<T>, 'loading'> {
  hasNextPage: boolean;
  loadMore: () => void;
  threshold?: number;
  loadingMore?: boolean;
  loadingMoreComponent?: React.ComponentType;
}

const InfiniteVirtualizedList = memo(forwardRef<HTMLDivElement, InfiniteVirtualizedListProps<any>>(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor = (_, index) => index,
  overscan = 5,
  className,
  itemClassName,
  onScroll,
  scrollElement,
  emptyComponent: EmptyComponent,
  loadingComponent: LoadingComponent,
  hasNextPage,
  loadMore,
  threshold = 5,
  loadingMore = false,
  loadingMoreComponent: LoadingMoreComponent,
}, ref) => {
  const { virtualItems, totalSize, isLoadingMore } = useInfiniteVirtualization(items, {
    itemHeight,
    containerHeight,
    overscan,
    scrollElement,
    hasNextPage,
    loadMore,
    threshold,
  });

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(event.currentTarget.scrollTop);
  }, [onScroll]);

  // Render empty state
  if (items.length === 0 && !isLoadingMore) {
    return EmptyComponent ? <EmptyComponent /> : (
      <div className={cn('flex items-center justify-center h-full text-gray-500', className)}>
        No items to display
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={keyExtractor(item, virtualItem.index)}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: virtualItem.start,
                left: 0,
                right: 0,
                height: virtualItem.size,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
        
        {/* Loading more indicator */}
        {(isLoadingMore || loadingMore) && (
          <div
            style={{
              position: 'absolute',
              top: totalSize,
              left: 0,
              right: 0,
              height: 60,
            }}
            className="flex items-center justify-center"
          >
            {LoadingMoreComponent ? (
              <LoadingMoreComponent />
            ) : (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}));

InfiniteVirtualizedList.displayName = 'InfiniteVirtualizedList';

export { VirtualizedList, InfiniteVirtualizedList };
