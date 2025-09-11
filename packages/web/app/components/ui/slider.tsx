import * as React from 'react';

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  valueLabel?: string | number;
  // Optional convenience callback invoked with numeric value on change
  onValueChange?: (value: number) => void;
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueLabel, onValueChange, onChange, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (typeof onChange === 'function') onChange(e);
      if (typeof onValueChange === 'function') {
        const n = Number(e.currentTarget.value);
        onValueChange(n);
      }
    };
    return (
      <div className={cx('ui-field', className)}>
        {label != null && (
          <div
            className="ui-field__label"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <span>{label}</span>
            {valueLabel != null && <span>{valueLabel}</span>}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          className="ui-slider"
          onChange={handleChange}
          {...rest}
        />
      </div>
    );
  },
);
Slider.displayName = 'Slider';

export default Slider;
