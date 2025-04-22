import { Chain } from '@rainbow-me/rainbowkit';

export const arbitrumLocal = {
  id: 412346,
  name: 'Arbitrum Local',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8547'] },
  },
} as const satisfies Chain;

export const arbitrumSepolia = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://arb-sepolia.g.alchemy.com/v2/4Fz5j6zHZW8RjDfSnUmER1rvh4iiBWgm',
      ],
    },
  },
} as const satisfies Chain;
