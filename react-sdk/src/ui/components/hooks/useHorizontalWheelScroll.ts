import { useEffect, type RefObject } from 'react';

export function useHorizontalWheelScroll(target: RefObject<HTMLElement>): void {
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const farthest = element.scrollWidth - element.clientWidth;
      const atStart = element.scrollLeft <= 0;
      const atEnd = element.scrollLeft >= farthest - 1;
      if (farthest <= 0 || (event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;
      element.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [target]);
}
