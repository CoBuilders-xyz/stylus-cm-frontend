'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ConnectWalletProps {
  customCallback?: () => void;
}

export default function ConnectWallet({ customCallback }: ConnectWalletProps) {
  return (
    <div className='' onClick={() => customCallback?.()}>
      <ConnectButton
        label='Connect Wallet'
        accountStatus={'full'}
        chainStatus={'none'}
      />
    </div>
  );
}
