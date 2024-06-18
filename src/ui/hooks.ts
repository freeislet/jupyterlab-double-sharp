import * as React from 'react';

export function useMutationObserver<T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  callback: MutationCallback,
  options?: MutationObserverInit
) {
  React.useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(callback);
      observer.observe(ref.current, options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
}

export type CallbackRef<T extends HTMLElement = HTMLElement> = (
  el: T | null
) => void;

export function useMutationObserverRef<T extends HTMLElement = HTMLElement>(
  callback: MutationCallback,
  options?: MutationObserverInit
): [CallbackRef<T>, T | null] {
  const [node, setNode] = React.useState<T | null>(null);

  React.useEffect(() => {
    if (node) {
      const observer = new MutationObserver(callback);
      observer.observe(node, options);
      return () => observer.disconnect();
    }
    return () => {};
  }, [node, callback, options]);

  const ref: CallbackRef<T> = React.useCallback((el: T | null) => {
    setNode(el);
  }, []);

  return [ref, node];
}
