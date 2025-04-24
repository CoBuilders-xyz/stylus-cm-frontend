'use client';

import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider as RKP,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import customChains from '../config/customChains';
// Create the query client
const queryClient = new QueryClient();

// Create the Wagmi config
const config = getDefaultConfig({
  appName: 'RainbowKit Connection',
  projectId: '4e32b2a9d664968a074a03167e046cbd',
  chains: [arbitrum, arbitrumSepolia, ...customChains],
  ssr: true,
});

export function RainbowKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RKP
          theme={darkTheme({
            accentColor: '#FFFFFF',
            accentColorForeground: 'black',
            fontStack: 'system',
          })}
        >
          {children}
        </RKP>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
