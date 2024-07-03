import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '.';
import { useElementSizeRef } from './hooks';

export interface ICollapsibleProps extends IDivProps {
  collapse: boolean;
}

export default function Collapsible({
  collapse,
  className,
  children,
  ...props
}: ICollapsibleProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [contentRef, contentSize] = useElementSizeRef<HTMLDivElement>();

  React.useEffect(() => {
    const maxHeight = collapse ? null : contentSize.height + 'px';
    ref.current!.style.setProperty('max-height', maxHeight);
    // Log.debug('Collapsible', collapse, maxHeight);
  }, [collapse, contentSize]);

  return (
    <div
      ref={ref}
      className={cn('jp-DoubleSharp-Collapsible', className)}
      {...props}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
