import * as React from 'react';

export interface ImagePreviewProps {
  file?: File | null;
  url?: string | null;
  label?: React.ReactNode;
  note?: React.ReactNode;
  onRemove?: () => void;
  size?: number; // square px
}

export default function ImagePreview({ file, url, label, note, onRemove, size = 96 }: ImagePreviewProps) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file) {
      const u = URL.createObjectURL(file);
      setObjectUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setObjectUrl(null);
    return undefined;
  }, [file]);

  const src = file ? objectUrl : (url || null);
  if (!src) return null;

  return (
    <div className="ui-image-preview">
      {label && <div className="ui-field__label" style={{ marginBottom: 6 }}>{label}</div>}
      <div className="ui-image-preview__body" style={{ width: size, height: size }}>
        <img src={src} alt="preview" className="ui-image-preview__img" />
        {onRemove && (
          <button type="button" className="ui-image-preview__remove" onClick={onRemove} aria-label="Remove image">×</button>
        )}
      </div>
      {note && <div className="ui-image-preview__note">{note}</div>}
    </div>
  );
}
