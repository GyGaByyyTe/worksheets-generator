export const metadata = {
  title: 'Worksheets Generator',
  description: 'UI for generating worksheets via REST API',
};

import '@/globals.css';
import AppShell from '@/components/AppShell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
