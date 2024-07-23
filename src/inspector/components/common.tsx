import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '../../ui';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';
import InlineBlock from '../../ui/inline';

// Boolean

export interface IBooleanProps {
  value: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}

export function Boolean_({ value, onChange, children }: IBooleanProps) {
  return (
    <Checkbox
      className="jp-DoubleSharp-row"
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
      className="jp-DoubleSharp-row"
      checked={value}
      onChangeValue={onChange}
    >
      <span>{children}</span>
    </NullableCheckbox>
  );
}

// Cell ID

export interface ICellIdProps extends IDivProps {
  id: string;
  length?: number;
}

export function CellId({
  id,
  length = 8,
  className,
  children,
  ...props
}: ICellIdProps) {
  return (
    <>
      <InlineBlock
        title={id}
        className={cn('jp-DoubleSharp-Inspector-Id', className)}
        {...props}
      >
        {id.substring(0, length)}
      </InlineBlock>
      {children}
    </>
  );
}

// Row

export interface IRowProps extends IDivProps {
  rowGap?: 8 | null;
  spaceX?: 2 | 4 | 8 | null;
  wrap?: boolean;
}

export function Row({
  rowGap = 8,
  spaceX,
  wrap,
  className,
  children,
  ...props
}: IRowProps) {
  return (
    <div
      className={cn(
        'jp-DoubleSharp-row',
        rowGap && `jp-DoubleSharp-row-gap-${rowGap}`,
        spaceX && `jp-DoubleSharp-space-x-${spaceX}`,
        wrap && 'jp-DoubleSharp-flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// List

export interface IListProps<T> extends IDivProps {
  data: T[] | undefined;
  inline?: boolean;
}

export function List<T extends React.ReactNode>({
  data,
  inline = true,
  className,
  ...props
}: IListProps<T>) {
  return (
    <>
      {data &&
        data.map((item, idx) => (
          <div
            key={idx}
            className={cn(className, inline && 'jp-DoubleSharp-inline-block')}
            {...props}
          >
            {item}
          </div>
        ))}
    </>
  );
}
