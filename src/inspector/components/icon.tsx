import * as React from 'react';
import cn from 'classnames';
import { FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';
import { LiaComment } from 'react-icons/lia';

import { ISVGProps } from '../../ui';
import { useElementSizeRef, useElementSizeTarget } from '../../ui/hooks';
import { getOffsetParent, getOffsetOverflow } from '../../utils/dom';

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
  const [tooltipRef, tooltipSize] = useElementSizeRef<HTMLDivElement>();
  const [setContainer, containerSize] = useElementSizeTarget();
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const container = getOffsetParent(tooltipRef.current!);
    setContainer(container);
  }, []);
  React.useEffect(() => {
    // 툴팁이 containing block 벗어나지 않게 위치 조정
    const el = tooltipRef.current!;
    const overflow = getOffsetOverflow(el, 4);
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
  }, [tooltipSize, containerSize]);

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
