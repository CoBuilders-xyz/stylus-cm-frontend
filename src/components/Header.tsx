'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from 'public/logo.svg';
import { Megaphone } from 'lucide-react';
import { useAlertSettings } from '@/context/AlertSettingsProvider';
import { GasTankModal } from './GasTankModal';
import BlockchainSelector from './BlockchainSelector';
import ConnectWallet from './ConnectWallet';
import ConnectionBanner from './ConnectionBanner';

export default function Header() {
  const { openAlertSettings } = useAlertSettings();
  const pathname = usePathname();

  const navItems = [
    { href: '/cache-status', label: 'Cache Status' },
    { href: '/blockchain-events', label: 'Cache Events' },
    { href: '/explore-contracts', label: 'Explore Contracts' },
    { href: '/my-contracts', label: 'My Contracts' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className='w-full bg-black text-white z-10 flex flex-wrap items-center justify-between p-4 px-10 fixed'>
      <div className='space-x-4 text-xs flex items-center'>
        <span className='flex items-center'>
          <Link href='/cache-status'>
            <Image src={logo} alt='logo' className='mr-2' />
          </Link>
        </span>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative pb-1 ${
              isActive(item.href)
                ? 'text-white'
                : 'text-white hover:text-gray-300'
            }`}
          >
            {item.label}
            {isActive(item.href) && (
              <div
                className='absolute bottom-0 left-0 w-full h-0.5'
                style={{ backgroundColor: '#2D99DD' }}
              />
            )}
          </Link>
        ))}
        <Link
          href='https://cobuilders-xyz.github.io/stylus-cm-deploy/'
          target='_blank'
          className='text-white hover:text-gray-300 pb-1'
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
