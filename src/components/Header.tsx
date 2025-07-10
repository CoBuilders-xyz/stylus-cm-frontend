'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from 'public/logo.svg';
import { Megaphone } from 'lucide-react';
import { useAlertSettings } from '@/context/AlertSettingsProvider';
import { GasTankModal } from './GasTankModal';
import BlockchainSelector from './BlockchainSelector';
import ConnectWallet from './ConnectWallet';
import ConnectionBanner from './ConnectionBanner';

export default function Header() {
  const { openAlertSettings } = useAlertSettings();

  return (
    <div className='w-full bg-black text-white z-10 flex flex-wrap items-center justify-between p-4 px-10 fixed'>
      <div className='space-x-4 text-xs flex items-center'>
        <span className='flex items-center'>
          <Link href='/cache-status'>
            <Image src={logo} alt='logo' className='mr-2' />
          </Link>
        </span>
        <Link href='/cache-status'>Cache Status</Link>
        <Link href='/blockchain-events'>Cache Events</Link>
        <Link href='/explore-contracts'>Explore Contracts</Link>
        <Link href='/my-contracts'>My Contracts</Link>
        <Link
          href='https://cobuilders-xyz.github.io/stylus-cm-deploy/'
          target='_blank'
        >
          Docs
        </Link>
      </div>
      <div className='space-x-4 text-xs flex items-center'>
        <GasTankModal />
        <div
          className='border border-white rounded-[10px] p-2 flex items-center justify-center cursor-pointer hover:bg-gray-900'
          style={{ borderWidth: '1px' }}
          onClick={openAlertSettings}
          title='Alert Settings'
        >
          <Megaphone className='w-4 h-4' />
        </div>
        <BlockchainSelector />
        <ConnectWallet />
      </div>
      <ConnectionBanner />
    </div>
  );
}
