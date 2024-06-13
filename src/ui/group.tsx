import * as React from 'react';
import cn from 'classnames';

import { IChildrenProps } from '.';

export interface IGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IChildrenProps {}

export default function Group({ className, children }: IGroupProps) {
  return (
    <div className={cn('jp-DoubleSharp-Group', className)}>{children}</div>
  );
}

export interface IGroupTitleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IChildrenProps {}

function GroupTitle({ className, children }: IGroupTitleProps) {
  return (
    <div className={cn('jp-DoubleSharp-Group-title', className)}>
      {children}
    </div>
  );
}
Group.Title = GroupTitle;
