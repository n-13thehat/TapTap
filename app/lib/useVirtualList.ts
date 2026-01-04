import { useEffect, useMemo, useRef, useState } from 'react';

export function useVirtualList(count: number, rowHeight = 116) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const onResize = () => setHeight(el.clientHeight);
    onResize();
    el.addEventListener('scroll', onScroll);
    const ro = new ResizeObserver(onResize); ro.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 4);
  const visibleCount = height ? Math.ceil(height / rowHeight) + 8 : 30;
  const endIndex = Math.min(count, startIndex + visibleCount);
  const offsetY = startIndex * rowHeight;
  const totalHeight = count * rowHeight;

  return { containerRef, startIndex, endIndex, offsetY, totalHeight };
}
