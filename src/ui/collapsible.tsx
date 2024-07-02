import * as React from 'react';
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
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current!;

    if (collapse) {
      const heightIsTemporary = el.style.maxHeight === 'revert';
      if (heightIsTemporary && el.scrollHeight) {
        el.style.maxHeight = el.scrollHeight + 'px';
        requestAnimationFrame(() => el.style.setProperty('max-height', null));
      } else {
        el.style.setProperty('max-height', null);
      }
    } else {
      const maybeInvalidScrollHeight = el.scrollHeight === 0;
      el.style.maxHeight = maybeInvalidScrollHeight
        ? 'revert'
        : el.scrollHeight + 'px';
    }

    // console.debug('Mutation', collapse, el.scrollHeight, el.style.maxHeight);
  }, [collapse]);
  // TODO: resize observer 작용

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
