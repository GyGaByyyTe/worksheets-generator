import * as React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <input ref={ref} type="checkbox" className={cx('ui-checkbox', className)} checked={checked} {...props} />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
