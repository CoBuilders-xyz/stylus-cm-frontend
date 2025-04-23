import { Chain } from '@rainbow-me/rainbowkit';

// Define custom chains here
const productionChains: Chain[] = [
  // Add your production chains here
  // Example:
  // {
  //   id: 42161,
  //   name: 'Arbitrum One',
  //   iconBackground: '#fff',
  //   nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  //   rpcUrls: {
  //     default: { http: ['https://arb1.arbitrum.io/rpc'] },
  //   },
  // } as const satisfies Chain,
];

// Local development chain
const arbitrumLocal = {
  id: 412346,
  name: 'Arbitrum Local',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8547'] },
  },
} as const satisfies Chain;

// Only include arbitrumLocal in development environment
const isDevelopment = process.env.NODE_ENV === 'development';
const customChains = isDevelopment
  ? [...productionChains, arbitrumLocal]
  : productionChains;

export default customChains;
