'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWallet() {
  return (
    <div className=''>
      <ConnectButton
        label='Connect Wallet'
        accountStatus={'full'}
        chainStatus={'name'}
      />
    </div>
  );
}
