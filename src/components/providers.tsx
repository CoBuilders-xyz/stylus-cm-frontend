'use client';

import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { arbitrumLocal, arbitrumSepolia } from '../config/chains';
// Create the query client
const queryClient = new QueryClient();

// Create the Wagmi config
const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '4e32b2a9d664968a074a03167e046cbd',
  chains: [arbitrum, arbitrumSepolia, arbitrumLocal],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FFFFFF',
            accentColorForeground: 'black',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
