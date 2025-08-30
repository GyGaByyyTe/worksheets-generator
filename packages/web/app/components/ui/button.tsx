import * as React from 'react';

export type ButtonVariant = 'default' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        className={cx(
          'ui-btn',
          variant && `ui-btn--${variant}`,
          size && `ui-btn--${size}`,
          isDisabled && 'ui-btn--disabled',
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? <span className="ui-btn__spinner" aria-hidden>…</span> : null}
        <span>{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
