export const metadata = {
  title: 'Worksheets Generator',
  description: 'UI for generating worksheets via REST API',
};

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <header>
          <h1>Worksheets Generator</h1>
          <nav>
            <a href="/">Home</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <small>© {new Date().getFullYear()} Worksheets Generator</small>
        </footer>
      </body>
    </html>
  );
}
