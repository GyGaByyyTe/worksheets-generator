'use client';

import { useFormStatus } from 'react-dom';

export default function LoadingButton({
  loadingLabel = 'Loading...',
  label = 'Action',
  ...props
}) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit" {...props}>
      {pending ? (loadingLabel ?? 'Loading...') : (label ?? 'Action')}
    </button>
  );
}
