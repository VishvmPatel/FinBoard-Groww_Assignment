import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/Provider';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinBoard - Finance Dashboard Builder',
  description: 'Connect to APIs and build your custom finance dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



