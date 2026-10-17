import { useLayoutEffect, useState, type RefObject } from 'react';

import { outlineFitsContainer } from '../../view/outline/outlineFit';

const DEFAULT_REM_PX = 16;

/**
 * Decides once whether the outline starts open. An explicit choice wins; otherwise the first
 * non-zero container width decides. Returns undefined until that measurement exists.
 */
export function useInitialOutlineOpen(
  targetRef: RefObject<HTMLElement>,
  explicit: boolean | undefined,
): boolean | undefined {
  const [measured, setMeasured] = useState<boolean>();

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (explicit !== undefined || !target) return;

    function measure(): boolean {
      const width = target!.clientWidth;
      if (width === 0) return false;
      setMeasured(outlineFitsContainer(width, remSizeOf(target!)));
      return true;
    }

    if (measure()) return;
    if (typeof ResizeObserver === 'undefined') {
      setMeasured(true);
      return;
    }
    const observer = new ResizeObserver(() => {
      if (measure()) observer.disconnect();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef, explicit]);

  return explicit ?? measured;
}

function remSizeOf(element: HTMLElement): number {
  const root = element.ownerDocument.documentElement;
  return parseFloat(element.ownerDocument.defaultView?.getComputedStyle(root).fontSize ?? '') || DEFAULT_REM_PX;
}
