import { useEffect, useRef, useState, type SyntheticEvent } from 'react';

/** Open state for a `<details>` popover that also closes on a press outside it. */
export function usePopover() {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // composedPath() sees through shadow roots, such as the editor surface's.
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (ref.current && !event.composedPath().includes(ref.current)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  return {
    ref,
    open,
    onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open),
    close: () => setOpen(false),
  };
}
