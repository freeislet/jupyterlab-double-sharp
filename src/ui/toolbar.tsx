import * as React from 'react';
import cn from 'classnames';

import { IDivProps, IButtonProps } from '.';

export interface IToolbarProps extends IDivProps {}

export default function Toolbar({
  className,
  children,
  ...props
}: IToolbarProps) {
  return (
    <div className={cn('jp-DoubleSharp-Toolbar', className)} {...props}>
      {children}
    </div>
  );
}

export interface IToolbarButtonProps extends IButtonProps {}

function ToolbarButton({ className, children, ...props }: IToolbarButtonProps) {
  return (
    <button
      className={cn('jp-DoubleSharp-Toolbar-button', className)}
      {...props}
    >
      {children}
    </button>
  );
}
Toolbar.Button = ToolbarButton;
