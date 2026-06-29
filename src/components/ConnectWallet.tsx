'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletProps {
  customCallback?: () => void;
}

export default function ConnectWallet({ customCallback }: ConnectWalletProps) {
  return (
    <div
      // RainbowKit's button stretches its label over two lines on narrow
      // containers; force single-line + smaller text below sm so the mobile
      // header stays compact.
      className='[&_button]:whitespace-nowrap [&_button]:!text-xs sm:[&_button]:!text-sm [&_button]:!py-1.5 sm:[&_button]:!py-2 [&_button]:!min-h-[36px]'
      onClick={() => customCallback?.()}
    >
      <ConnectButton
        label='Connect'
        accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
        chainStatus={'none'}
      />
    </div>
  );
}
