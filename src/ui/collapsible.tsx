import * as React from 'react';
import cn from 'classnames';

import { IDivChildrenProps } from '.';

export interface ICollapsibleProps extends IDivChildrenProps {
  collapse: boolean;
}

export default function Collapsible({
  collapse,
  className,
  children,
  ...props
}: ICollapsibleProps) {
  const ref = React.useRef<HTMLDivElement>(null!);

  React.useLayoutEffect(() => {
    // const maxHeight = collapse ? null : ref.current.scrollHeight + 'px';
    // NOTE: scrollHeight 초기화 및 contents 추가 반영 이슈로 일단 max-height 애니메이션 없이 revert, 추후 MutationObserver 적용
    const maxHeight = collapse ? null : 'revert';
    ref.current.style.setProperty('max-height', maxHeight);
  }, [collapse]);

  return (
    <div
      ref={ref}
      className={cn('jp-DoubleSharp-Collapsible', className)}
      {...props}
    >
      {children}
    </div>
  );
}
