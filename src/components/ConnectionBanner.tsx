'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuthentication } from '@/context/AuthenticationProvider';
import { Check, LoaderCircle, WifiOff } from 'lucide-react';

export default function ConnectionBanner() {
  const { isConnecting, isConnected } = useAccount();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthentication();
  const [isOnline, setIsOnline] = useState(true); // Default to true for SSR
  const [showLoading, setShowLoading] = useState(false);
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);
  const isLoading = isConnecting || isAuthLoading;

  // Check internet connection - only run in browser
  useEffect(() => {
    // Set initial online status
    setIsOnline(typeof window !== 'undefined' ? window.navigator.onLine : true);

    const updateOnlineStatus = () => setIsOnline(window.navigator.onLine);

    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  // Avoid flashing a loading notice for authentication that completes quickly.
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Show the successful connection notice briefly.
  useEffect(() => {
    if (isAuthenticated) {
      setShowConnectedBanner(true);
      const timer = setTimeout(() => {
        setShowConnectedBanner(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Don't render anything if all conditions are normal
  if (isOnline && !showLoading && !showConnectedBanner) {
    return null;
  }

  const notice = !isOnline
    ? {
        icon: <WifiOff className='size-4' />,
        label: 'No internet connection',
        mobileLabel: 'No internet',
        className: 'bg-warn-soft text-warn',
      }
    : showLoading
      ? {
          icon: <LoaderCircle className='size-4 animate-spin' />,
          label:
            isConnected && isAuthLoading
              ? 'Please sign message to authenticate'
              : 'Connecting wallet',
          mobileLabel:
            isConnected && isAuthLoading
              ? 'Sign to authenticate'
              : 'Connecting',
          className: 'bg-accent-soft text-accent-blue',
        }
      : {
          icon: <Check className='size-4' />,
          label: 'Wallet connected successfully!',
          mobileLabel: 'Wallet connected',
          className: 'bg-ok-soft text-ok-text',
        };

  return (
    <div
      role='status'
      aria-live='polite'
      className={`fixed z-50 top-16 end-[14px] sm:end-auto sm:left-1/2 sm:-translate-x-1/2 min-h-9 w-max max-w-[calc(100vw-28px)] px-3.5 rounded-lg border border-hairline-strong flex items-center justify-center gap-2 whitespace-nowrap text-center font-medium text-[12.5px] shadow-lg ${notice.className}`}
    >
      {notice.icon}
      <span className='sm:hidden'>{notice.mobileLabel}</span>
      <span className='hidden sm:inline'>{notice.label}</span>
    </div>
  );
}
