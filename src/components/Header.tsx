'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Menu, MessageCircle, Search } from 'lucide-react';
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
      <div
        id='app-header'
        className='w-full h-14 bg-page/90 backdrop-blur-md border-b border-hairline text-ink-1 z-10 flex items-center justify-between gap-3 px-[14px] sm:px-6 fixed top-0'
      >
        {/* Left section - Logo and Navigation */}
        <div className='flex items-center min-w-0'>
          <Link
            href='/cache-status'
            className='flex items-center gap-2 shrink-0'
          >
            <span className='text-[13px] font-bold tracking-tight whitespace-nowrap text-ink-1'>
              Stylus Manager
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className='hidden lg:flex items-center gap-px ms-3'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ${
                  isActive(item.href)
                    ? 'bg-surface-3 text-ink-1 font-medium'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-surface-2'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href='https://cobuilders-xyz.github.io/stylus-cm-deploy/'
              target='_blank'
              className='whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] text-ink-2 hover:text-ink-1 hover:bg-surface-2 transition-colors'
            >
              Docs
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={FEEDBACK_FORM_URL}
                    target='_blank'
                    aria-label='Give us feedback'
                    className='rounded-md p-1.5 text-ink-2 hover:text-ink-1 hover:bg-surface-2 inline-flex items-center transition-colors'
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
        <div className='flex gap-2 items-center min-w-0 shrink-0'>
          {/* Mobile-only alert settings */}
          <button
            type='button'
            className='lg:hidden size-8 border border-hairline rounded-lg flex items-center justify-center text-ink-2 hover:text-ink-1 hover:border-hairline-strong bg-surface-1'
            onClick={openAlertSettings}
            title='Alert Settings'
            aria-label='Open alert settings'
          >
            <Megaphone className='w-4 h-4' />
          </button>

          {/* Desktop actions */}
          <div className='hidden lg:flex gap-2 items-center'>
            <button
              type='button'
              className='h-8 rounded-lg border border-hairline bg-surface-1 px-2.5 text-ink-2 outline-none transition-colors hover:border-hairline-strong hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-accent-blue/50 flex items-center gap-2'
              onClick={() =>
                window.dispatchEvent(
                  new Event('stylus:open-command-palette')
                )
              }
              aria-label='Open command palette'
            >
              <Search className='size-3.5' aria-hidden='true' />
              <span className='text-[11px]'>Commands</span>
              <kbd className='rounded border border-hairline px-1 py-0.5 text-[9px] text-ink-3'>
                Ctrl+K / ⌘K
              </kbd>
            </button>
            <GasTankModal />
            <button
              type='button'
              className='size-8 border border-hairline rounded-lg flex items-center justify-center text-ink-2 hover:text-ink-1 hover:border-hairline-strong bg-surface-1'
              onClick={openAlertSettings}
              title='Alert Settings'
              aria-label='Open alert settings'
            >
              <Megaphone className='w-4 h-4' />
            </button>
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
                className='lg:hidden min-h-[36px] min-w-[36px] border border-hairline rounded-lg bg-surface-1 text-ink-2 hover:text-ink-1 hover:border-hairline-strong flex items-center justify-center'
                aria-label='Open navigation menu'
              >
                <Menu className='w-4 h-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-64 bg-surface-2 border-hairline-strong text-ink-1'
            >
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} className='p-0'>
                  <Link
                    href={item.href}
                    className={`w-full px-3 py-3 rounded-sm text-[13px] ${
                      isActive(item.href)
                        ? 'text-ink-1 font-medium bg-surface-3'
                        : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3'
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
                  className='w-full px-3 py-3 rounded-sm text-[13px] text-ink-2 hover:text-ink-1 hover:bg-surface-3'
                >
                  Docs
                </Link>
              </DropdownMenuItem>
              {/* BlockchainSelector inside the mobile menu — don't let
                  DropdownMenuItem close the menu when the selector opens. */}
              <DropdownMenuItem
                className='p-0 sm:hidden focus:bg-transparent'
                onSelect={(e) => e.preventDefault()}
              >
                <div className='w-full px-3 py-3'>
                  <BlockchainSelector />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConnectionBanner />
    </>
  );
}
