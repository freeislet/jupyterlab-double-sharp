import * as React from 'react';
import cn from 'classnames';

import { IDivProps } from '../../ui';

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

export interface IListRowProps<T> extends IHeaderRowProps {
  data: T[] | undefined;
  inline?: boolean;
}

export function ListRow<T extends React.ReactNode>({
  data,
  inline = true,
  className,
  ...props
}: IListRowProps<T>) {
  return (
    <HeaderRow {...props}>
      {data?.map((item, idx) => (
        <div
          key={idx}
          className={cn(className, inline && 'jp-DoubleSharp-inline-block')}
          {...props}
        >
          {item}
        </div>
      ))}
    </HeaderRow>
  );
}
