import * as React from 'react';
import cn from 'classnames';

import { IChildrenProps } from '../ui';

export interface IToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    IChildrenProps {}

export default function ToolbarButton({
  className,
  children,
  ...props
}: IToolbarButtonProps) {
  return (
    <button
      className={cn(
        'jp-ToolbarButtonComponent jp-mod-minimal jp-Button',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
