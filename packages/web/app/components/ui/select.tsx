import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select ref={ref} className={cx('ui-select', className)} {...props}>
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export default Select;
