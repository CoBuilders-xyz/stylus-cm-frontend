'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from 'public/logo.svg';
import { Megaphone, Menu } from 'lucide-react';
import { useAlertSettings } from '@/context/AlertSettingsProvider';
import { GasTankModal } from './GasTankModal';
import BlockchainSelector from './BlockchainSelector';
import ConnectWallet from './ConnectWallet';
import ConnectionBanner from './ConnectionBanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <>
      <div className='w-full bg-black text-white z-10 flex items-center justify-between p-4 px-4 sm:px-10 fixed'>
        {/* Left section - Logo and Navigation */}
        <div className='flex items-center space-x-4 text-xs'>
          <span className='flex items-center'>
            <Link href='/cache-status'>
              <Image src={logo} alt='logo' className='mr-2' />
            </Link>
          </span>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className='hidden lg:flex items-center space-x-4'>
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

          {/* Mobile Menu Trigger - Shown only on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='lg:hidden p-2 hover:bg-gray-800 rounded-md'>
                <Menu className='w-5 h-5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='w-64 bg-black border-gray-800 text-white'
            >
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} className='p-0'>
                  <Link
                    href={item.href}
                    className={`w-full px-2 py-2 ${
                      isActive(item.href)
                        ? 'text-white font-medium bg-gray-800'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className='p-0'>
                <Link
                  href='https://cobuilders-xyz.github.io/stylus-cm-deploy/'
                  target='_blank'
                  className='w-full px-2 py-2 text-gray-300 hover:text-white hover:bg-gray-800'
                >
                  Docs
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right section - Actions (Always visible) */}
        <div className='flex space-x-2 sm:space-x-4 text-xs items-center'>
          {/* Mobile-only alert settings */}
          <button
            className='lg:hidden border border-white rounded-[10px] p-2 flex items-center justify-center hover:bg-gray-900'
            style={{ borderWidth: '1px' }}
            onClick={openAlertSettings}
            title='Alert Settings'
          >
            <Megaphone className='w-4 h-4' />
          </button>

          {/* Desktop actions */}
          <div className='hidden lg:flex space-x-4 items-center'>
            <GasTankModal />
            <div
              className='border border-white rounded-[10px] p-2 flex items-center justify-center cursor-pointer hover:bg-gray-900'
              style={{ borderWidth: '1px' }}
              onClick={openAlertSettings}
              title='Alert Settings'
            >
              <Megaphone className='w-4 h-4' />
            </div>
          </div>

          {/* Always visible */}
          <BlockchainSelector />
          <ConnectWallet />
        </div>
      </div>

      {/* ConnectionBanner - always below header for all screen sizes */}
      <div className='w-full fixed top-16 z-10'>
        <ConnectionBanner />
      </div>
    </>
  );
}
