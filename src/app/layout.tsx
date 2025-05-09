import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '../context/RainbowKitProvider';
import Header from '@/components/Header';
import { AuthenticationProvider } from '../context/AuthenticationProvider';
import { AlertSettingsProvider } from '../context/AlertSettingsProvider';
import { Toaster } from '@/components/ui/sonner';

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
            <AlertSettingsProvider>
              <Header />
              {children}
            </AlertSettingsProvider>
          </AuthenticationProvider>
        </RainbowKitProvider>
        <Toaster />
      </body>
    </html>
  );
}
