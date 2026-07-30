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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Arial'],
});

export const metadata: Metadata = {
  title: 'Stylus Manager',
  description: 'For Managing Arbitrum Stylus Contracts',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
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
          <BlockchainSelectionProvider>
            <AuthenticationProvider>
              <AlertSettingsProvider>
                <div className='min-h-dvh flex flex-col'>
                  <Header />
                  <main className='flex-1 flex flex-col min-h-0'>
                    {children}
                  </main>
                  <Footer />
                </div>
              </AlertSettingsProvider>
            </AuthenticationProvider>
          </BlockchainSelectionProvider>
        </RainbowKitProvider>
        <Toaster />
      </body>
    </html>
  );
}
