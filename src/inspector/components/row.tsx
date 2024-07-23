import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '../../ui';
import InlineBlock from '../../ui/inline';
import { CellId } from './common';

// Row

export interface IRowProps extends IDivProps {
  rowGap?: 8 | null;
  rowGapInner?: 4 | null;
  spaceX?: 2 | 4 | 8 | null;
  wrap?: boolean;
}

export function Row({
  rowGap = 8,
  rowGapInner = 4,
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
        rowGapInner && `jp-DoubleSharp-flex-row-gap-${rowGapInner}`,
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

// Row with header

export interface IHeaderRowProps extends IRowProps {
  header: string;
  // TODO: inlineHeader: boolean;
}

export function HeaderRow({
  spaceX = 4,
  wrap = true,
  header,
  children,
  ...props
}: IHeaderRowProps) {
  return (
    <Row spaceX={spaceX} wrap={wrap} {...props}>
      <strong>{header}</strong>
      {children}
    </Row>
  );
}

// Row with header, list

export interface INameListRowProps<T> extends IHeaderRowProps {
  data: T[] | undefined;
  nameComponent?: React.ComponentType<any>;
}

export function NameListRow<T extends React.ReactNode>({
  data,
  nameComponent = InlineBlock,
  className,
  ...props
}: INameListRowProps<T>) {
  const Name = nameComponent;

  return (
    <HeaderRow {...props}>
      {data?.map((item, idx) => (
        <Name
          key={idx}
          className={cn('jp-DoubleSharp-inline-block', className)}
        >
          {item}
        </Name>
      ))}
    </HeaderRow>
  );
}

// Row of cell ID list

export interface ICellIdListRowProps extends IHeaderRowProps {
  data: string[] | undefined; // Cell Model IDs
}

export function CellIdListRow({
  data,
  className,
  ...props
}: ICellIdListRowProps) {
  return (
    <HeaderRow {...props}>
      {data?.map((id, idx) => (
        <CellId
          key={idx}
          id={id}
          className={cn('jp-DoubleSharp-inline-block', className)}
        />
      ))}
    </HeaderRow>
  );
}
