import * as React from 'react';
import { forwardRef } from 'react';

import { IChildrenProps } from '.';

export interface ICheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    IChildrenProps {}

const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <label className={className} style={style}>
        <input ref={ref} type="checkbox" {...props} />
        {children}
      </label>
    );
  }
);
export default Checkbox;
