'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuthentication } from '@/context/AuthenticationProvider';
import Image from 'next/image';
import loadingIcon from 'public/icons/loading.svg';
import connectedIcon from 'public/icons/connected.svg';
// No connection icon can't be fetched from public folder
function NoConnectionIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M2 2L22 22'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.5 16.5C9.43464 15.5839 10.6912 15.0707 12 15.0707C13.3088 15.0707 14.5654 15.5839 15.5 16.5'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M2 8.82C3.23397 7.71224 4.64308 6.81676 6.17 6.17'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M10.6599 5C14.6699 4.64 18.7999 5.9 21.9999 8.76'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16.8501 11.25C17.6648 11.7037 18.4121 12.2692 19.0701 12.93'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5 13C6.42792 11.572 8.25472 10.6098 10.24 10.24'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M12 20H12.01'
        stroke='black'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export default function ConnectionBanner() {
  const { isConnecting, isConnected } = useAccount();
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
          ? 'bg-[#FFC470] text-black'
          : isConnecting
          ? 'bg-[#335CD7] text-white'
          : isAuthLoading
          ? 'bg-[#335CD7] text-white'
          : 'bg-[#33D75C] text-black'
      }`}
    >
      {!isOnline && (
        <span className='flex items-center justify-center'>
          <div className='w-4 h-4 mr-2'>
            <NoConnectionIcon />
          </div>
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

      {isOnline && isConnected && isAuthLoading && (
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
          <Image src={connectedIcon} alt='Connected' className='w-4 h-4 mr-2' />
          Wallet connected successfully!
        </span>
      )}
    </div>
  );
}
