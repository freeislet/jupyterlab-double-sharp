import * as React from 'react';
import merge from 'lodash.merge';
import equal from 'fast-deep-equal';

export type DispatchPartial<A> = (value: Partial<A>) => void;

export function useStateObject<S>(
  initialState: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>, DispatchPartial<S>] {
  const [state, setState] = React.useState(initialState);
  const updateState = React.useCallback((partial: Partial<S>) => {
    setState(state => {
      const merged = merge({}, state, partial);
      if (equal(merged, state)) return state; // rerender 방지
      return merged;
    });
  }, []);

  return [state, setState, updateState];
}
