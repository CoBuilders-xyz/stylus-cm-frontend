'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuthentication } from '@/context/AuthenticationProvider';
import { Check, LoaderCircle, WifiOff } from 'lucide-react';

export default function ConnectionBanner() {
  const { isConnecting, isConnected } = useAccount();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthentication();
  const [isOnline, setIsOnline] = useState(true); // Default to true for SSR
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);

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

  // Show connected banner for 3 seconds
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
  if (isOnline && !isConnecting && !isAuthLoading && !showConnectedBanner) {
    return null;
  }

  return (
    <>
      <div aria-hidden className='h-12 shrink-0' />
      <div
        className={`fixed inset-x-0 top-14 z-10 mt-2 h-10 px-4 flex items-center justify-center text-center font-medium text-[12.5px] ${
          !isOnline
            ? 'bg-warn/10 text-warn'
            : isConnecting
            ? 'bg-accent-soft text-accent-blue'
            : isAuthLoading
            ? 'bg-accent-soft text-accent-blue'
            : 'bg-ok-soft text-ok-text'
        }`}
      >
        {!isOnline && (
          <span className='flex items-center justify-center'>
            <WifiOff className='w-4 h-4 mr-2' />
            No internet connection
          </span>
        )}

        {isOnline && isConnecting && (
          <span className='flex items-center justify-center'>
            <LoaderCircle className='w-4 h-4 mr-2 animate-spin' />
            Loading
          </span>
        )}

        {isOnline && isConnected && isAuthLoading && (
          <span className='flex items-center justify-center'>
            <LoaderCircle className='w-4 h-4 mr-2 animate-spin' />
            Please sign message to authenticate
          </span>
        )}

        {isOnline && !isConnecting && showConnectedBanner && (
          <span className='flex items-center justify-center'>
            <Check className='w-4 h-4 mr-2' />
            Wallet connected successfully!
          </span>
        )}
      </div>
    </>
  );
}
