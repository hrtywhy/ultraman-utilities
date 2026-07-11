import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext<(msg?: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback((m?: string) => {
    setMsg(m || 'Copied');
    setShow(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), 1400);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '')}>{msg}</div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export function useCopy() {
  const toast = useToast();
  return (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'));
  };
}
