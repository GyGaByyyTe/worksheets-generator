'use client';

import { useFormStatus } from 'react-dom';
import { useT } from '../../i18n/I18nProvider';

export default function LoadingButton({
  loadingLabel,
  label,
  ...props
}: {
  [x: string]: any;
  loadingLabel?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();
  const t = useT();
  const loading = loadingLabel ?? t('actions.generating');
  const idle = label ?? t('actions.generate');

  return (
    <button disabled={pending} type="submit" {...props}>
      {pending ? loading : idle}
    </button>
  );
}
