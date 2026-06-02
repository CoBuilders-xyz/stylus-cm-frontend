'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletProps {
  customCallback?: () => void;
}

// Rainbow Kit's button stretches to fit the label across two lines on narrow
// containers. Force single-line + smaller text below sm so it doesn't make
// the header look tall on mobile.
export default function ConnectWallet({ customCallback }: ConnectWalletProps) {
  return (
    <div
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
