/**
 * Virtualization hooks for large lists
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface VirtualizationOptions {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  scrollElement?: HTMLElement | null;
}

export interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

export interface VirtualizationResult {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToOffset: (offset: number) => void;
}

/**
 * Hook for virtualizing large lists
 */
export function useVirtualization(
  itemCount: number,
  options: VirtualizationOptions
): VirtualizationResult {
  const { itemHeight, containerHeight, overscan = 5, scrollElement } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(scrollElement || null);
  
  // Calculate item sizes and positions
  const itemMetadata = useMemo(() => {
    const metadata: Array<{ start: number; end: number; size: number }> = [];
    let currentOffset = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const size = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
      metadata[i] = {
        start: currentOffset,
        end: currentOffset + size,
        size,
      };
      currentOffset += size;
    }
    
    return metadata;
  }, [itemCount, itemHeight]);
  
  const totalSize = itemMetadata[itemCount - 1]?.end || 0;
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (itemCount === 0) return { start: 0, end: 0 };
    
    const viewportStart = scrollTop;
    const viewportEnd = scrollTop + containerHeight;
    
    // Binary search for start index
    let startIndex = 0;
    let endIndex = itemCount - 1;
    
    while (startIndex <= endIndex) {
      const middleIndex = Math.floor((startIndex + endIndex) / 2);
      const item = itemMetadata[middleIndex];
      
      if (item.end <= viewportStart) {
        startIndex = middleIndex + 1;
      } else if (item.start >= viewportStart) {
        endIndex = middleIndex - 1;
      } else {
        startIndex = middleIndex;
        break;
      }
    }
    
    // Binary search for end index
    let start = startIndex;
    let end = itemCount - 1;
    
    while (start <= end) {
      const middleIndex = Math.floor((start + end) / 2);
      const item = itemMetadata[middleIndex];
      
      if (item.start < viewportEnd) {
        start = middleIndex + 1;
      } else {
        end = middleIndex - 1;
      }
    }
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(itemCount - 1, end + overscan),
    };
  }, [scrollTop, containerHeight, itemCount, itemMetadata, overscan]);
  
  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const metadata = itemMetadata[i];
      if (metadata) {
        items.push({
          index: i,
          start: metadata.start,
          end: metadata.end,
          size: metadata.size,
        });
      }
    }
    
    return items;
  }, [visibleRange, itemMetadata]);
  
  // Scroll event handler
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);
  
  // Set up scroll listener
  useEffect(() => {
    const element = scrollElementRef.current || window;
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, scrollElement]);
  
  // Update scroll element ref
  useEffect(() => {
    scrollElementRef.current = scrollElement || null;
  }, [scrollElement]);
  
  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (index < 0 || index >= itemCount) return;
      
      const item = itemMetadata[index];
      if (!item) return;
      
      let scrollTop: number;
      
      switch (align) {
        case 'start':
          scrollTop = item.start;
          break;
        case 'center':
          scrollTop = item.start - (containerHeight - item.size) / 2;
          break;
        case 'end':
          scrollTop = item.end - containerHeight;
          break;
      }
      
      const element = scrollElementRef.current;
      if (element && 'scrollTo' in element) {
        element.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } else if (element) {
        element.scrollTop = scrollTop;
      } else {
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    },
    [itemCount, itemMetadata, containerHeight]
  );
  
  // Scroll to offset
  const scrollToOffset = useCallback((offset: number) => {
    const element = scrollElementRef.current;
    if (element && 'scrollTo' in element) {
      element.scrollTo({ top: offset, behavior: 'smooth' });
    } else if (element) {
      element.scrollTop = offset;
    } else {
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, []);
  
  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
  };
}

/**
 * Hook for infinite scrolling with virtualization
 */
export function useInfiniteVirtualization<T>(
  items: T[],
  options: VirtualizationOptions & {
    hasNextPage: boolean;
    loadMore: () => void;
    threshold?: number;
  }
): VirtualizationResult & {
  isLoadingMore: boolean;
} {
  const { hasNextPage, loadMore, threshold = 5 } = options;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const virtualization = useVirtualization(items.length, options);
  
  // Check if we need to load more items
  useEffect(() => {
    const lastVisibleIndex = Math.max(...virtualization.virtualItems.map(item => item.index));
    const shouldLoadMore = hasNextPage && 
                          !isLoadingMore && 
                          lastVisibleIndex >= items.length - threshold;
    
    if (shouldLoadMore) {
      setIsLoadingMore(true);
      loadMore();
    }
  }, [virtualization.virtualItems, hasNextPage, isLoadingMore, items.length, threshold, loadMore]);
  
  // Reset loading state when new items are added
  useEffect(() => {
    setIsLoadingMore(false);
  }, [items.length]);
  
  return {
    ...virtualization,
    isLoadingMore,
  };
}

/**
 * Hook for grid virtualization
 */
export function useGridVirtualization(
  itemCount: number,
  options: {
    itemWidth: number;
    itemHeight: number;
    containerWidth: number;
    containerHeight: number;
    gap?: number;
    overscan?: number;
    scrollElement?: HTMLElement | null;
  }
) {
  const { 
    itemWidth, 
    itemHeight, 
    containerWidth, 
    containerHeight, 
    gap = 0, 
    overscan = 5,
    scrollElement 
  } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Calculate grid dimensions
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowCount = Math.ceil(itemCount / columnsPerRow);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap));
    const endRow = Math.ceil((scrollTop + containerHeight) / (itemHeight + gap));
    
    const startCol = Math.floor(scrollLeft / (itemWidth + gap));
    const endCol = Math.ceil((scrollLeft + containerWidth) / (itemWidth + gap));
    
    return {
      startRow: Math.max(0, startRow - overscan),
      endRow: Math.min(rowCount - 1, endRow + overscan),
      startCol: Math.max(0, startCol - overscan),
      endCol: Math.min(columnsPerRow - 1, endCol + overscan),
    };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, itemHeight, itemWidth, gap, overscan, rowCount, columnsPerRow]);
  
  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items: Array<{
      index: number;
      row: number;
      col: number;
      x: number;
      y: number;
    }> = [];
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const index = row * columnsPerRow + col;
        if (index < itemCount) {
          items.push({
            index,
            row,
            col,
            x: col * (itemWidth + gap),
            y: row * (itemHeight + gap),
          });
        }
      }
    }
    
    return items;
  }, [visibleRange, columnsPerRow, itemCount, itemWidth, itemHeight, gap]);
  
  // Scroll event handler
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);
  
  // Set up scroll listener
  useEffect(() => {
    const element = scrollElement || window;
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, scrollElement]);
  
  const totalWidth = columnsPerRow * (itemWidth + gap) - gap;
  const totalHeight = rowCount * (itemHeight + gap) - gap;
  
  return {
    virtualItems,
    totalWidth,
    totalHeight,
    columnsPerRow,
    rowCount,
  };
}
