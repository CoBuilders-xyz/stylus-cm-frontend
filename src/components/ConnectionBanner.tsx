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
    <div
      className={`w-full mt-2 py-2 px-4 text-center font-medium text-sm transition-all duration-300 ease-in-out ${
        !isOnline
          ? 'bg-[#FFC470] text-black'
          : isConnecting
          ? 'bg-[#335CD7] text-white'
          : isAuthLoading
          ? 'bg-[#335CD7] text-white'
          : 'bg-[#10B981] text-black'
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
  );
}
