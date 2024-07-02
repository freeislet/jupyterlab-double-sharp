import * as React from 'react';
import { forwardRef } from 'react';

import { IInputProps } from '.';

export type ICheckboxProps = IInputProps & {
  checked: boolean;
  indeterminate?: boolean;
  onChangeValue?: (checked: boolean) => void;
};

const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(
  (
    {
      checked,
      indeterminate,
      onChangeValue,
      className,
      style,
      onChange,
      children,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useLayoutEffect(() => {
      inputRef.current!.indeterminate = indeterminate ?? false;
    });
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    return (
      <label className={className} style={style}>
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
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

/**
 * nullable tri-state checkbox (indeterminate 사용)
 */

export type INullableCheckboxProps = Omit<
  ICheckboxProps,
  'checked' | 'indeterminate' | 'onChangeValue'
> & {
  checked: boolean | null;
  onChangeValue?: (checked: boolean | null) => void;
};

export const NullableCheckbox = forwardRef<
  HTMLInputElement,
  INullableCheckboxProps
>(({ checked, onChangeValue, children, ...props }, ref) => {
  function toggle(cb: HTMLInputElement) {
    // indeterminate -> checked -> unchecked -> indeterminate 순서로 변경
    switch (checked) {
      // indeterminate -> checked
      case null:
        cb.indeterminate = false;
        cb.checked = true;
        checked = true;
        break;

      // checked -> unchecked
      case true:
        cb.indeterminate = false;
        cb.checked = false;
        checked = false;
        break;

      // unchecked -> indeterminate
      case false:
        cb.indeterminate = true;
        cb.checked = false;
        checked = null;
        break;
    }

    onChangeValue?.(checked);
  }

  return (
    <Checkbox
      ref={ref}
      checked={checked ?? false}
      indeterminate={checked === null}
      onClick={e => toggle(e.currentTarget)}
      {...props}
    >
      {children}
    </Checkbox>
  );
});
