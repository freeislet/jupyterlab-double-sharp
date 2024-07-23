import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '.';

export interface IInlineBlockProps extends IDivProps {}

export default function InlineBlock({
  className,
  children,
  ...props
}: IInlineBlockProps) {
  return (
    <div className={cn('jp-DoubleSharp-InlineBlock', className)} {...props}>
      {children}
    </div>
  );
}
