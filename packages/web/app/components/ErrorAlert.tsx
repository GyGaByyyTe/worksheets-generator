'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';

export type ErrorAlertProps = { message: string | null };

export default function ErrorAlert({ message }: ErrorAlertProps) {
  const t = useT();
  if (!message) return null;
  return <div className="error">{t(message)}</div>;
}
