import * as React from 'react';
import cn from 'classnames';
import { AiFillCheckCircle, AiFillCloseCircle } from 'react-icons/ai';
import { TbInfoSquare } from 'react-icons/tb';
import { VscInfo, VscWarning, VscError } from 'react-icons/vsc';

import { IDivProps, ISVGProps } from '../../ui';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';

// Row

export function Row({ className, children, ...props }: IDivProps) {
  return (
    <div className={cn('jp-DoubleSharp-Inspector-row', className)} {...props}>
      {children}
    </div>
  );
}

// Boolean

export interface IBooleanProps {
  value: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}

export function Boolean_({ value, onChange, children }: IBooleanProps) {
  return (
    <Checkbox
      className="jp-DoubleSharp-Inspector-row-single"
      checked={value}
      onChangeValue={onChange}
    >
      <span>{children}</span>
    </Checkbox>
  );
}

export interface INullableBooleanProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  children?: React.ReactNode;
}

export function NullableBoolean({
  value,
  onChange,
  children
}: INullableBooleanProps) {
  return (
    <NullableCheckbox
      className="jp-DoubleSharp-Inspector-row-single"
      checked={value}
      onChangeValue={onChange}
    >
      <span>{children}</span>
    </NullableCheckbox>
  );
}

// StatusIcon

export type StatusIconType = 'ok' | 'no';

const statuses: Record<StatusIconType, [React.ComponentType<any>, string]> = {
  // [icon, className]
  ok: [AiFillCheckCircle, 'jp-DoubleSharp-Inspector-StatusIcon-ok'],
  no: [AiFillCloseCircle, 'jp-DoubleSharp-Inspector-StatusIcon-no']
};

export interface IStatusIconProps extends ISVGProps {
  type: StatusIconType;
}

export function StatusIcon({ type, className, ...props }: IStatusIconProps) {
  const [Icon, iconClass] = statuses[type];

  return (
    <Icon
      className={cn(
        'jp-DoubleSharp-Inspector-StatusIcon',
        iconClass,
        className
      )}
      {...props}
    />
  );
}

// TooltipIcon

export interface ITooltipIconProps extends ISVGProps {
  children: React.ReactNode;
}

export function TooltipIcon({
  children,
  className,
  ...props
}: ITooltipIconProps) {
  return (
    <div className="jp-DoubleSharp-Inspector-TooltipIcon">
      <TbInfoSquare
        className={cn('jp-DoubleSharp-Inspector-TooltipIcon-icon', className)}
        {...props}
      />
      <div className="jp-DoubleSharp-Inspector-TooltipIcon-content">
        {children}
      </div>
    </div>
  );
}

// Block

export type BlockType = 'info' | 'warning' | 'error';

const blocks: Record<BlockType, [React.ComponentType<any>, string]> = {
  // [icon, className]
  info: [VscInfo, 'jp-DoubleSharp-Inspector-Block-info'],
  warning: [VscWarning, 'jp-DoubleSharp-Inspector-Block-warning'],
  error: [VscError, 'jp-DoubleSharp-Inspector-Block-error']
};

export interface IBlockProps extends IDivProps {
  type: BlockType;
}

export function Block({ type, className, children, ...props }: IBlockProps) {
  const [Icon, bgClass] = blocks[type];

  return (
    <div
      className={cn('jp-DoubleSharp-Inspector-Block', bgClass, className)}
      {...props}
    >
      <Icon className="jp-DoubleSharp-Inspector-Block-icon" />
      <div>{children}</div>
    </div>
  );
}
