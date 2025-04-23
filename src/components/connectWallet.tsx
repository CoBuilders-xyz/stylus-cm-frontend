'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Providers } from './providers';

export default function ConnectWallet() {
  return (
    <div className=''>
      <Providers>
        <ConnectButton
          label='Connect Wallet'
          accountStatus={'full'}
          chainStatus={'name'}
        />
        {/* <Authenticate /> */}
      </Providers>
    </div>
  );
}
