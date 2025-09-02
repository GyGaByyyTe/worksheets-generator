import * as React from 'react';

export interface FilePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  onFile?: (file: File | null) => void;
  // If provided, picker will trigger this target input instead of rendering its own input
  browseTarget?: () => HTMLInputElement | null;
}

export const FilePicker = React.forwardRef<HTMLInputElement, FilePickerProps>(
  ({ label, onFile, browseTarget, ...props }, ref) => {
    if (browseTarget) {
      return (
        <div className="ui-file">
          {label && <div className="ui-field__label">{label}</div>}
          <button
            type="button"
            className="ui-btn ui-btn--outline"
            onClick={() => browseTarget()?.click()}
          >
            {props.placeholder || 'Choose file'}
          </button>
        </div>
      );
    }
    return (
      <div className="ui-file">
        {label && <div className="ui-field__label">{label}</div>}
        <input
          ref={ref}
          type="file"
          className="ui-file__input"
          onChange={(e) =>
            onFile?.((e.target as HTMLInputElement).files?.[0] || null)
          }
          {...props}
        />
      </div>
    );
  },
);
FilePicker.displayName = 'FilePicker';

export default FilePicker;
