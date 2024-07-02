import * as React from 'react';
import useResizeObserver from '@react-hook/resize-observer';

export interface ISize {
  width: number;
  height: number;
}

export function useElementSize<T extends Element>(
  target: React.MutableRefObject<T | null>,
  round = false
): ISize {
  const [size, setSize] = React.useState<ISize>({ width: 0, height: 0 });

  const setSizeInternal = ({ width, height }: ISize) => {
    setSize(
      round
        ? { width: Math.round(width), height: Math.round(height) }
        : { width, height }
    );
  };

  React.useLayoutEffect(() => {
    if (target.current) {
      setSizeInternal(target.current.getBoundingClientRect());
    }
  }, [target]);

  useResizeObserver(target, entry => {
    const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
    setSizeInternal({ width, height });
  });

  return size;
}

export function useElementSizeRef<T extends Element>(
  round = false
): [React.RefObject<T>, ISize] {
  const target = React.useRef<T>(null);
  const size = useElementSize(target, round);
  return [target, size];
}
