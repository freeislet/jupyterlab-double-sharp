import * as React from 'react';
import useMutationObserver from '@rooks/use-mutation-observer';
import cn from 'classnames';

import { IDivProps } from '.';

export interface ICollapsibleProps extends IDivProps {
  collapse: boolean;
}

export default function Collapsible({
  collapse,
  className,
  children,
  ...props
}: ICollapsibleProps) {
  const ref = React.useRef<HTMLDivElement>(null!);

  const update = (mutations?: MutationRecord[]) => {
    // console.debug('Collapsible', ref.current.scrollHeight, collapse, mutations);
    const maxHeight = collapse ? null : ref.current.scrollHeight + 'px';
    ref.current.style.setProperty('max-height', maxHeight);
  };
  useMutationObserver(ref, update, { subtree: true, childList: true });

  React.useLayoutEffect(() => update(), [collapse]);

  return (
    <div
      ref={ref}
      className={cn('jp-DoubleSharp-Collapsible', className)}
      {...props}
    >
      {children}
    </div>
  );
}
