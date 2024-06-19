import * as React from 'react';
import merge from 'lodash.merge';
import equal from 'fast-deep-equal';

export type DispatchPartial<A> = (value: Partial<A>) => void;
export type UpdateStateCallback<A> = (value: Partial<A>, merged: A) => void;

export function useStateObject<S>(
  initialState: S | (() => S),
  onUpdate?: UpdateStateCallback<S>
): [S, DispatchPartial<S>, React.Dispatch<React.SetStateAction<S>>] {
  const [state, setState] = React.useState(initialState);
  const updateState = React.useCallback((partial: Partial<S>) => {
    setState(state => {
      const merged = merge({}, state, partial);
      if (equal(merged, state)) return state; // rerender 방지

      onUpdate?.(partial, merged);
      return merged;
    });
  }, []);

  return [state, updateState, setState];
}
