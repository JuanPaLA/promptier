import { useLayoutEffect, type RefObject } from 'react';

/**
 * Keeps a `position: fixed` panel below its anchor and inside the viewport
 * while shown. Fixed positioning lets the panel escape a scrolling toolbar,
 * which would otherwise clip it.
 */
export function useAnchoredPanel(anchor: RefObject<HTMLElement>, panel: RefObject<HTMLElement>, shown: boolean): void {
  useLayoutEffect(() => {
    if (!shown) return;
    const place = () => {
      if (!anchor.current || !panel.current) return;
      const bounds = anchor.current.getBoundingClientRect();
      const rightmost = window.innerWidth - panel.current.offsetWidth - VIEWPORT_MARGIN;
      panel.current.style.top = `${bounds.bottom + ANCHOR_GAP}px`;
      panel.current.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(bounds.left, rightmost))}px`;
    };
    place();
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    };
  }, [anchor, panel, shown]);
}

const ANCHOR_GAP = 6;
const VIEWPORT_MARGIN = 8;
