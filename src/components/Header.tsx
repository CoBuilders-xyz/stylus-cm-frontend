'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from 'public/logo.svg';
import { Megaphone, Menu, MessageCircle } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FEEDBACK_FORM_URL } from '@/utils/env';

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
      <div className='w-full bg-black text-white z-10 flex items-center justify-between p-4 px-4 sm:px-10 fixed top-8'>
        {/* Left section - Logo and Navigation */}
        <div className='flex items-center space-x-4 text-xs'>
          <span className='flex items-center'>
            <Link
              href='/cache-status'
              className='flex items-center gap-2 mr-2'
            >
              <Image src={logo} alt='Stylus Manager logo' />
              <span className='hidden sm:inline text-sm font-semibold tracking-wide whitespace-nowrap'>
                Stylus Manager
              </span>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={FEEDBACK_FORM_URL}
                    target='_blank'
                    className='text-white hover:text-gray-300 pb-1 inline-flex items-center'
                  >
                    <MessageCircle className='w-4 h-4' />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Give us Feedback</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right section - Actions (Always visible) */}
        <div className='flex space-x-1.5 sm:space-x-4 text-xs items-center min-w-0'>
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

          {/* BlockchainSelector hidden on the smallest viewports to make room
              for ConnectWallet + hamburger. Available via the mobile menu. */}
          <div className='hidden sm:block'>
            <BlockchainSelector />
          </div>
          <ConnectWallet />
          {/* Mobile Menu Trigger - Shown only on mobile */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className='lg:hidden min-h-[40px] min-w-[40px] p-2 hover:bg-gray-800 rounded-md flex items-center justify-center'
                aria-label='Open navigation menu'
              >
                <Menu className='w-5 h-5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-64 bg-black border-gray-800 text-white'
            >
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} className='p-0'>
                  <Link
                    href={item.href}
                    className={`w-full px-3 py-3 ${
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
                  className='w-full px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800'
                >
                  Docs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className='p-0 sm:hidden'>
                <div className='w-full px-3 py-3'>
                  <BlockchainSelector />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ConnectionBanner - always below header for all screen sizes */}
      <div className='w-full fixed top-24 z-10'>
        <ConnectionBanner />
      </div>
    </>
  );
}
