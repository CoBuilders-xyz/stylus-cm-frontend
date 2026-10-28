'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectWalletProps {
  customCallback?: () => void;
}

export default function ConnectWallet({ customCallback }: ConnectWalletProps) {
  const runAction = (action: () => void) => {
    customCallback?.();
    action();
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              className: 'pointer-events-none select-none opacity-0',
            })}
          >
            {!connected ? (
              <Button
                type='button'
                onClick={() => runAction(openConnectModal)}
              >
                Connect
              </Button>
            ) : chain.unsupported ? (
              <Button
                type='button'
                variant='outline'
                onClick={() => runAction(openChainModal)}
              >
                Wrong network
              </Button>
            ) : (
              <Button
                type='button'
                variant='outline'
                className='max-w-[112px] gap-1.5 px-2.5'
                onClick={() => runAction(openAccountModal)}
              >
                <span className='truncate'>{account.displayName}</span>
                <ChevronDown className='size-3.5 shrink-0' />
              </Button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
