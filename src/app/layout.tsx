import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '../context/RainbowKitProvider';
import Header from '@/components/Header';
import ConnectionBanner from '@/components/ConnectionBanner';
import { AuthenticationProvider } from '../context/AuthenticationProvider';
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
          <AuthenticationProvider>
            <Header />
            <ConnectionBanner />
            {children}
          </AuthenticationProvider>
        </RainbowKitProvider>
      </body>
    </html>
  );
}
