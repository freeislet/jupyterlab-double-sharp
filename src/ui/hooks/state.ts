import * as React from 'react';
import merge from 'lodash.merge';
import equal from 'fast-deep-equal';

export type DispatchPartial<A> = (value: Partial<A>) => void;
export type UpdateStateCallback<A> = (value: Partial<A>, merged: A) => void;

export function useStateObject<S>(
  initialState: S | (() => S),
  onUpdate?: UpdateStateCallback<S>
): [
  S,
  React.Dispatch<React.SetStateAction<S>>,
  DispatchPartial<S>,
  React.Dispatch<UpdateStateCallback<S>>
] {
  const [state, setState] = React.useState(initialState);
  const onUpdateRef = React.useRef(onUpdate);
  const updateState = React.useCallback((partial: Partial<S>) => {
    setState(state => {
      const merged = merge({}, state, partial);
      if (equal(merged, state)) return state; // rerender 방지

      onUpdateRef.current?.(partial, merged);
      return merged;
    });
  }, []);
  const setOnUpdate = React.useCallback((onUpdate?: UpdateStateCallback<S>) => {
    onUpdateRef.current = onUpdate;
  }, []);

  return [state, setState, updateState, setOnUpdate];
}
