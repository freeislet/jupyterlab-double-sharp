import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '.';

export interface IGroupProps extends IDivProps {
  spaceY?: 8 | null;
}

export default function Group({
  spaceY = 8,
  className,
  children,
  ...props
}: IGroupProps) {
  return (
    <div
      className={cn(
        'jp-DoubleSharp-Group',
        spaceY && `jp-DoubleSharp-space-y-${spaceY}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface IGroupTitleProps extends IDivProps {}

function GroupTitle({ className, children, ...props }: IGroupTitleProps) {
  return (
    <div className={cn('jp-DoubleSharp-Group-title', className)} {...props}>
      {children}
    </div>
  );
}
Group.Title = GroupTitle;
