import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '../components/RainbowKitProvider';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Arbitrum Cache Manager UI',
  description: 'For Managing Arbitrum Cache',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <RainbowKitProvider>
          <Header />
        </RainbowKitProvider>
        {children}
      </body>
    </html>
  );
}
