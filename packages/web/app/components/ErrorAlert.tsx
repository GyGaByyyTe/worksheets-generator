"use client";
import React from 'react';

export type ErrorAlertProps = { message: string | null };

export default function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;
  return <div className="error">{message}</div>;
}
