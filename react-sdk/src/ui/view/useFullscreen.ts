import { useEffect, useState, type RefObject } from 'react';

export function useFullscreen(targetRef: RefObject<HTMLElement>) {
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    const ownerDocument = target.ownerDocument;

    setAvailable(
      ownerDocument.fullscreenEnabled &&
        typeof target.requestFullscreen === 'function',
    );

    function syncState(): void {
      setActive(ownerDocument.fullscreenElement === target);
    }

    ownerDocument.addEventListener('fullscreenchange', syncState);
    syncState();
    return () => {
      ownerDocument.removeEventListener('fullscreenchange', syncState);
    };
  }, [targetRef]);

  function toggle(): void {
    const target = targetRef.current;
    if (!target) return;
    const ownerDocument = target.ownerDocument;
    const transition = ownerDocument.fullscreenElement === target
      ? ownerDocument.exitFullscreen()
      : target.requestFullscreen();
    void transition.catch(() => undefined);
  }

  return { active, available, toggle };
}
