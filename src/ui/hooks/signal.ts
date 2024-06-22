import * as React from 'react';
import { ISignal, Slot } from '@lumino/signaling';

export function useSignal<SENDER, ARGS>(
  signal: ISignal<SENDER, ARGS>,
  slot: Slot<SENDER, ARGS>,
  deps?: React.DependencyList
) {
  React.useEffect(() => {
    signal.connect(slot);
    return () => {
      signal.disconnect(slot);
    };
  }, deps);
}
