import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '../context/RainbowKitProvider';
import Header from '@/components/Header';
import { AuthenticationProvider } from '../context/AuthenticationProvider';
import { AlertSettingsProvider } from '../context/AlertSettingsProvider';
import { BlockchainSelectionProvider } from '../context/BlockchainSelectionProvider';
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stylus Cache Manager',
  description: 'For Managing Arbitrum Stylus Cache',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='bg-background'>
      <body className={`${inter.className} min-h-screen overflow-x-hidden`}>
        <RainbowKitProvider>
          <BlockchainSelectionProvider>
            <AuthenticationProvider>
              <AlertSettingsProvider>
                <Header />
                {children}
                <Footer />
              </AlertSettingsProvider>
            </AuthenticationProvider>
          </BlockchainSelectionProvider>
        </RainbowKitProvider>
        <Toaster />
      </body>
    </html>
  );
}
