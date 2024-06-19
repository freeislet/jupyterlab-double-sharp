import * as React from 'react';
import { forwardRef } from 'react';

import { IInputProps } from '.';

export type ICheckboxProps = IInputProps & {
  checked: boolean;
  onChangeValue?: (checked: boolean) => void;
};

const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(
  ({ className, style, onChange, onChangeValue, children, ...props }, ref) => {
    return (
      <label className={className} style={style}>
        <input
          ref={ref}
          type="checkbox"
          onChange={e => {
            onChange?.(e);
            onChangeValue?.(e.target.checked);
          }}
          {...props}
        />
        {children}
      </label>
    );
  }
);
export default Checkbox;
