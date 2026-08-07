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
import GlobalCommandPalette from '@/components/GlobalCommandPalette';

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
                <a
                  href='#main-content'
                  className='fixed start-3 top-3 z-[100] -translate-y-20 rounded-md bg-accent-blue px-3 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0'
                >
                  Skip to main content
                </a>
                <div className='min-h-dvh flex flex-col'>
                  <Header />
                  <main
                    id='main-content'
                    tabIndex={-1}
                    className='flex-1 flex flex-col min-h-0 outline-none'
                  >
                    {children}
                  </main>
                  <Footer />
                </div>
                <GlobalCommandPalette />
              </AlertSettingsProvider>
            </AuthenticationProvider>
          </BlockchainSelectionProvider>
        </RainbowKitProvider>
        <Toaster />
      </body>
    </html>
  );
}
