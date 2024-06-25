import * as React from 'react';
import cn from 'classnames';
import { AiFillCheckCircle, AiFillCloseCircle } from 'react-icons/ai';
import { VscInfo, VscWarning, VscError } from 'react-icons/vsc';

import { IDivProps } from '../../ui';
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

export function Boolean({ value, onChange, children }: IBooleanProps) {
  return (
    <Checkbox
      className="jp-DoubleSharp-Inspector-row"
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
      className="jp-DoubleSharp-Inspector-row"
      checked={value}
      onChangeValue={onChange}
    >
      <span>{children}</span>
    </NullableCheckbox>
  );
}

// Status

export type StatusType = 'ok' | 'no';

const statuses: Record<StatusType, [React.ComponentType<any>, string]> = {
  // [icon, className]
  ok: [AiFillCheckCircle, 'jp-DoubleSharp-Inspector-Status-icon-ok'],
  no: [AiFillCloseCircle, 'jp-DoubleSharp-Inspector-Status-icon-no']
};

export interface IStatusProps extends IDivProps {
  type: StatusType;
}

export function Status({ type, className, children, ...props }: IStatusProps) {
  const [Icon, iconClass] = statuses[type];

  return (
    <div
      className={cn('jp-DoubleSharp-Inspector-Status', className)}
      {...props}
    >
      <Icon className={cn('jp-DoubleSharp-Inspector-Status-icon', iconClass)} />
      {children}
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
