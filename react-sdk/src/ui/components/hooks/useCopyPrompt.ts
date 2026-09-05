import { useEffect, useRef, useState } from 'react'

export type CopyStatus = 'idle' | 'copying' | 'copied' | 'failed';

export function useCopyPrompt(readPrompt: () => string) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const request = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => {
    request.current += 1;
    clearTimeout(timer.current);
  }, []);

  async function copy(): Promise<void> {
    const currentRequest = ++request.current;
    clearTimeout(timer.current);
    setStatus('copying');
    try {
      await navigator.clipboard.writeText(readPrompt());
      if (request.current !== currentRequest) return;
      setStatus('copied');
    } catch {
      if (request.current !== currentRequest) return;
      setStatus('failed');
    }
    timer.current = setTimeout(() => setStatus('idle'), 4000);
  }

  return { status, copy };
}
