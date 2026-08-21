import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ACE Sign Analytics - Marketing Intelligence Platform',
  description: 'Monitor and analyze all your marketing channels in one place',
  keywords: ['marketing', 'analytics', 'dashboard', 'email', 'social media', 'utm tracking'],
  authors: [{ name: 'ACE Sign' }],
  creator: 'ACE Sign',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://acesign-analytics.com',
    title: 'ACE Sign Analytics',
    description: 'Marketing Intelligence Platform'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
