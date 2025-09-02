import * as React from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div style={backdrop} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        {title != null && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};
const dialog: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 8,
  minWidth: 360,
  maxWidth: '90vw',
  boxShadow: '0 8px 24px rgba(0,0,0,.2)',
};
