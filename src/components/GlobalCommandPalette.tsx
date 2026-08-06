'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CalendarClock,
  CircleGauge,
  FileSearch,
  Keyboard,
  Search,
  WalletCards,
} from 'lucide-react';

import { useAlertSettings } from '@/context/AlertSettingsProvider';
import { FEEDBACK_FORM_URL } from '@/utils/env';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const navigation = [
  { href: '/cache-status', label: 'Cache Status', icon: CircleGauge, key: 'C' },
  {
    href: '/blockchain-events',
    label: 'Cache Events',
    icon: CalendarClock,
    key: 'E',
  },
  {
    href: '/explore-contracts',
    label: 'Explore Contracts',
    icon: FileSearch,
    key: 'X',
  },
  {
    href: '/my-contracts',
    label: 'My Contracts',
    icon: WalletCards,
    key: 'M',
  },
] as const;

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export default function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { openAlertSettings } = useAlertSettings();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingNavigationRef = useRef(false);
  const pendingNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setOpen(true);
      return;
    }

    setOpen(false);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      requestAnimationFrame(action);
    },
    []
  );

  const focusTableSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>(
      '[data-table-search-input]'
    );
    if (!input) return false;
    input.focus();
    input.select();
    return true;
  }, []);

  useEffect(() => {
    const handleOpenRequest = () => handleOpenChange(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && key === 'k') {
        event.preventDefault();
        handleOpenChange(!open);
        return;
      }

      if (event.key === 'Escape') {
        pendingNavigationRef.current = false;
        return;
      }

      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        handleOpenChange(true);
        return;
      }

      if (event.key === '/') {
        if (focusTableSearch()) event.preventDefault();
        return;
      }

      if (pendingNavigationRef.current) {
        const destination = navigation.find(
          (item) => item.key.toLowerCase() === key
        );
        pendingNavigationRef.current = false;
        if (pendingNavigationTimerRef.current) {
          clearTimeout(pendingNavigationTimerRef.current);
        }
        if (destination) {
          event.preventDefault();
          router.push(destination.href);
        }
        return;
      }

      if (key === 'g') {
        pendingNavigationRef.current = true;
        pendingNavigationTimerRef.current = setTimeout(() => {
          pendingNavigationRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('stylus:open-command-palette', handleOpenRequest);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(
        'stylus:open-command-palette',
        handleOpenRequest
      );
      window.removeEventListener('keydown', handleKeyDown);
      if (pendingNavigationTimerRef.current) {
        clearTimeout(pendingNavigationTimerRef.current);
      }
    };
  }, [focusTableSearch, handleOpenChange, open, router]);

  const hasTableSearch = [
    '/blockchain-events',
    '/explore-contracts',
    '/my-contracts',
  ].includes(pathname);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[calc(100%-28px)] gap-0 overflow-hidden border-hairline-strong p-0 sm:max-w-xl [&>button]:top-2 [&>button]:right-2'>
        <DialogTitle className='sr-only'>Command palette</DialogTitle>
        <DialogDescription className='sr-only'>
          Search commands and navigate Stylus Manager with the keyboard.
        </DialogDescription>
        <Command loop>
          <CommandInput placeholder='Type a command or search…' autoFocus />
          <CommandList>
            <CommandEmpty>No matching commands.</CommandEmpty>
            <CommandGroup heading='Navigate'>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`navigate ${item.label}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon aria-hidden='true' />
                    <span>{item.label}</span>
                    {pathname === item.href ? (
                      <span className='ms-auto text-[11px] text-ink-3'>Current</span>
                    ) : (
                      <CommandShortcut>G {item.key}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading='Actions'>
              {hasTableSearch && (
                <CommandItem
                  value='search current table contracts events'
                  onSelect={() => run(focusTableSearch)}
                >
                  <Search aria-hidden='true' />
                  <span>Search current table</span>
                  <CommandShortcut>/</CommandShortcut>
                </CommandItem>
              )}
              <CommandItem
                value='manage notification alert settings'
                onSelect={() => run(openAlertSettings)}
              >
                <Bell aria-hidden='true' />
                <span>Notification settings</span>
              </CommandItem>
              <CommandItem
                value='open documentation docs'
                onSelect={() =>
                  run(() =>
                    window.open(
                      'https://cobuilders-xyz.github.io/stylus-cm-deploy/',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  )
                }
              >
                <BookOpen aria-hidden='true' />
                <span>Open documentation</span>
              </CommandItem>
              <CommandItem
                value='send feedback'
                onSelect={() =>
                  run(() =>
                    window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer')
                  )
                }
              >
                <Keyboard aria-hidden='true' />
                <span>Send feedback</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className='flex items-center justify-between border-t border-hairline px-4 py-2 text-[10px] text-ink-3'>
            <span>↑↓ Navigate · Enter Select · Esc Close</span>
            <span className='hidden sm:inline'>⌘K</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
