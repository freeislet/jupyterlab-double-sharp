import * as React from 'react';
import cn from 'classnames';
import { FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';
import { LiaComment } from 'react-icons/lia';
import { VscInfo, VscWarning, VscError } from 'react-icons/vsc';

import { IDivProps, ISVGProps } from '../../ui';
import Checkbox, { NullableCheckbox } from '../../ui/checkbox';
import { getOverflowOffset } from '../../utils/dom';

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

// StatusIcon

export type StatusIconType = 'ok' | 'no';

const statuses: Record<StatusIconType, [React.ComponentType<any>, string]> = {
  // [icon, className]
  ok: [FaCircleCheck, 'jp-DoubleSharp-Inspector-StatusIcon-ok'],
  no: [FaCircleXmark, 'jp-DoubleSharp-Inspector-StatusIcon-no']
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
  const tooltipRef = React.useRef<HTMLDivElement>(null!);
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    // 툴팁이 containing block 벗어나지 않게 위치 조정
    const el = tooltipRef.current;
    const overflow = getOverflowOffset(el, 4);
    const overflowLeft = overflow.left + offset;
    const overflowRight = overflow.right - offset;
    const newOffset =
      overflowLeft > 0
        ? overflowLeft
        : overflowRight > 0
          ? Math.max(-overflowRight, overflowLeft)
          : 0;
    setOffset(newOffset);
    el.style.setProperty('--offset', newOffset + 'px');
    // Log.debug('TooltipIcon', overflow, offset, newOffset);
  }, [children]);

  return (
    <div className="jp-DoubleSharp-Inspector-TooltipIcon">
      <LiaComment
        className={cn('jp-DoubleSharp-Inspector-TooltipIcon-icon', className)}
        {...props}
      />
      <div
        ref={tooltipRef}
        className="jp-DoubleSharp-Inspector-TooltipIcon-tooltip"
      >
        {children}
      </div>
    </div>
  );
}

// Row

export function Row({ className, children, ...props }: IDivProps) {
  return (
    <div
      className={cn('jp-DoubleSharp-row jp-DoubleSharp-row-gap-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// List

export interface IListProps<T> extends IDivProps {
  list: T[] | undefined;
  header?: React.ReactNode;
  asRow?: boolean;
}

export function List<T extends React.ReactNode>({
  list,
  header,
  asRow = true,
  className,
  ...props
}: IListProps<T>) {
  return (
    <div
      className={cn(
        asRow && 'jp-DoubleSharp-row jp-DoubleSharp-row-gap-8',
        'jp-DoubleSharp-space-x-4',
        className
      )}
      {...props}
    >
      {header &&
        (typeof header === 'string' ? <strong>{header}</strong> : header)}
      {list && list.map((item, idx) => <span key={idx}>{item}</span>)}
    </div>
  );
}

// Block

export type BlockType = 'info' | 'warning' | 'error';

const blockIcons: Record<BlockType, React.ComponentType<any>> = {
  info: VscInfo,
  warning: VscWarning,
  error: VscError
};
const blockClassNames: Record<BlockType, string> = {
  info: 'jp-DoubleSharp-Inspector-Block-info',
  warning: 'jp-DoubleSharp-Inspector-Block-warning',
  error: 'jp-DoubleSharp-Inspector-Block-error'
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
  const Icon = blockIcons[iconType ?? type];
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
      <Icon className="jp-DoubleSharp-Inspector-Block-icon" />
      <div>{children}</div>
    </div>
  );
}
