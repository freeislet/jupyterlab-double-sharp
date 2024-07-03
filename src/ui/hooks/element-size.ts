import * as React from 'react';
import useResizeObserver from '@react-hook/resize-observer';

export interface ISize {
  width: number;
  height: number;
}

function roundOrAsIs({ width, height }: ISize, round: boolean): ISize {
  return round
    ? { width: Math.round(width), height: Math.round(height) }
    : { width, height };
}

/**
 * Element size 변화 감지
 * @param target target ref or target element or null
 * @param round 반올림 여부
 * @returns target size
 */
export function useElementSize<T extends Element>(
  target: React.MutableRefObject<T | null> | T | null,
  round = false
): ISize {
  const [size, setSize] = React.useState<ISize>({ width: 0, height: 0 });
  const setSizeInternal = (size: ISize) => setSize(roundOrAsIs(size, round));

  React.useLayoutEffect(() => {
    const targetEl = target && 'current' in target ? target.current : target;
    if (targetEl) {
      setSizeInternal(targetEl.getBoundingClientRect());
    }
  }, [target, round]);

  useResizeObserver(target, entry => {
    const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
    setSizeInternal({ width, height });
  });

  return size;
}

/**
 * useElementSize의 target ref 리턴 버전
 * @param round 반올림 여부
 * @returns [target ref, target size]
 */
export function useElementSizeRef<T extends Element = Element>(
  round = false
): [React.RefObject<T>, ISize] {
  const target = React.useRef<T>(null);
  const size = useElementSize(target, round);
  return [target, size];
}

/**
 * useElementSize의 target element를 나중에 지정하는 버전
 * @param round 반올림 여부
 * @returns [target dispatcher, target size]
 */
export function useElementSizeTarget<T extends Element = Element>(
  round = false
): [React.Dispatch<React.SetStateAction<T | null>>, ISize] {
  const [target, setTarget] = React.useState<T | null>(null);
  const size = useElementSize(target, round);
  return [setTarget, size];
}
