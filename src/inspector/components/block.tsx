import * as React from 'react';
import cn from 'classnames';
import { VscInfo, VscWarning, VscError } from 'react-icons/vsc';
import { FaCheck } from 'react-icons/fa6';

import { IDivProps } from '../../ui';

// Block

export type BlockType = 'info' | 'warning' | 'error' | 'success';

const blockIcons: Record<BlockType, React.ComponentType<any>> = {
  info: VscInfo,
  warning: VscWarning,
  error: VscError,
  success: FaCheck
};
const blockIconClassNames: Record<BlockType, string> = {
  info: 'jp-DoubleSharp-Inspector-Block-icon-info',
  warning: 'jp-DoubleSharp-Inspector-Block-icon-warning',
  error: 'jp-DoubleSharp-Inspector-Block-icon-error',
  success: 'jp-DoubleSharp-Inspector-Block-icon-success'
};
const blockClassNames: Record<BlockType, string> = {
  info: 'jp-DoubleSharp-Inspector-Block-info',
  warning: 'jp-DoubleSharp-Inspector-Block-warning',
  error: 'jp-DoubleSharp-Inspector-Block-error',
  success: 'jp-DoubleSharp-Inspector-Block-success'
};

export interface IBlockProps extends IDivProps {
  type: BlockType;
  iconType?: BlockType;
  asRow?: boolean;
}

export function Block({
  type,
  iconType,
  asRow = true,
  className,
  children,
  ...props
}: IBlockProps) {
  iconType = iconType ?? type;
  const Icon = blockIcons[iconType];
  const iconClass = blockIconClassNames[iconType];
  const bgClass = blockClassNames[type];

  return (
    <div
      className={cn(
        'jp-DoubleSharp-Inspector-Block',
        asRow && 'jp-DoubleSharp-row jp-DoubleSharp-row-gap-8',
        bgClass,
        className
      )}
      {...props}
    >
      <Icon className={cn('jp-DoubleSharp-Inspector-Block-icon', iconClass)} />
      <div>{children}</div>
    </div>
  );
}
