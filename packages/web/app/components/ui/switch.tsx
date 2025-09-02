import * as React from 'react';

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className={cx('ui-switch', className)}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={!!checked}
          {...props}
        />
        <span className="ui-switch__track" aria-hidden></span>
        {label != null && <span className="ui-switch__label">{label}</span>}
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export default Switch;
