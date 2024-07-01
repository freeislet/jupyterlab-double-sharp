import * as React from 'react';
import cn from 'classnames';
import { FaCircleCheck, FaCircleXmark, FaCheck } from 'react-icons/fa6';
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
  }, [children]); // TODO: children deps 대신 resize observer 적용

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
