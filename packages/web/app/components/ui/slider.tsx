import * as React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  valueLabel?: string | number;
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueLabel, ...props }, ref) => {
    return (
      <div className={cx('ui-field', className)}>
        {label != null && (
          <div className="ui-field__label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{label}</span>
            {valueLabel != null && <span>{valueLabel}</span>}
          </div>
        )}
        <input ref={ref} type="range" className="ui-slider" {...props} />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export default Slider;
