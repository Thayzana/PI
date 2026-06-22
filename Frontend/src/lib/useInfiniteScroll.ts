import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  pageSize: number;
  totalItems: number;
  resetDeps?: unknown[];
}

/** Carrega mais itens ao rolar até o sentinel dentro de `scrollRootRef`. */
export function useInfiniteScroll({
  pageSize,
  totalItems,
  resetDeps = [],
}: UseInfiniteScrollOptions) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, totalItems, ...resetDeps]);

  const hasMore = visibleCount < totalItems;

  useEffect(() => {
    const root = scrollRootRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + pageSize, totalItems));
        }
      },
      { root, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, pageSize, totalItems]);

  return {
    scrollRootRef,
    loadMoreRef,
    visibleCount,
    hasMore,
    visibleItems: <T,>(items: T[]) => items.slice(0, visibleCount),
  };
}
