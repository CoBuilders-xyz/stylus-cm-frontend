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
import FeedbackButton from '@/components/FeedbackButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stylus Cache Manager',
  description: 'For Managing Arbitrum Stylus Cache',
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
                <Header />
                {children}
                <Footer />
                <FeedbackButton />
              </AlertSettingsProvider>
            </AuthenticationProvider>
          </BlockchainSelectionProvider>
        </RainbowKitProvider>
        <Toaster />
      </body>
    </html>
  );
}
