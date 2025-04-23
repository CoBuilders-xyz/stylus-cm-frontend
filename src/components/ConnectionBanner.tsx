'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import noConnectionIcon from 'public/icons/no-internet-connection.svg';
import loadingIcon from 'public/icons/loading.svg';
import Image from 'next/image';
import { useAuthentication } from '@/context/AuthenticationProvider';

export default function ConnectionBanner() {
  const { isConnecting } = useAccount();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthentication();
  const [isOnline, setIsOnline] = useState(true);
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);

  // Check internet connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch('https://www.google.com', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Initial check
    checkConnection();

    // Set up interval to check connection periodically
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    // Add event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show connected banner for 3 seconds
  useEffect(() => {
    console.log('isAuthenticated', isAuthenticated);
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
    <div
      className={`w-full py-2 px-4 text-center font-medium text-sm transition-all duration-300 ease-in-out ${
        !isOnline
          ? 'bg-[#FFD700] text-black'
          : isConnecting
          ? 'bg-[#335CD7] text-white'
          : isAuthLoading
          ? 'bg-[#335CD7] text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      {!isOnline && (
        <span className='flex items-center justify-center'>
          <Image
            src={noConnectionIcon}
            alt='No connection'
            className='w-4 h-4 mr-2'
          />
          No internet connection
        </span>
      )}

      {isOnline && isConnecting && (
        <span className='flex items-center justify-center'>
          <Image
            src={loadingIcon}
            alt='Loading'
            className='w-4 h-4 mr-2 animate-spin'
          />
          Loading
        </span>
      )}

      {isOnline && !isConnecting && isAuthLoading && (
        <span className='flex items-center justify-center'>
          <Image
            src={loadingIcon}
            alt='Loading'
            className='w-4 h-4 mr-2 animate-spin'
          />
          Please sign transaction to authenticate
        </span>
      )}

      {isOnline && !isConnecting && showConnectedBanner && (
        <span className='flex items-center justify-center'>
          <svg
            className='w-4 h-4 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          Wallet connected successfully!
        </span>
      )}
    </div>
  );
}
