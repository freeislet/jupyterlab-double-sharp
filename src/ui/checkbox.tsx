import * as React from 'react';
import { forwardRef } from 'react';

import { IInputProps } from '.';

export interface ICheckboxProps extends IInputProps {}

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
