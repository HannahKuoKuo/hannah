import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ACE Sign - Marketing Dashboard',
  description: 'Complete marketing tracking and analytics platform'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
