import type { Metadata } from 'next';
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
import PrototypeBanner from '@/components/PrototypeBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stylus Manager',
  description:
    'Manage caching, activation, and lifecycle of your Stylus contracts on Arbitrum.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.className} min-h-screen`}>
        <RainbowKitProvider>
          <BlockchainSelectionProvider>
            <AuthenticationProvider>
              <AlertSettingsProvider>
                <PrototypeBanner />
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
