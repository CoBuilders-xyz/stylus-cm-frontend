'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

// Define the shape of the context data
interface AuthenticationContextType {
  accessToken: string;
  isLoading: boolean;
}

// Create the context
const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

// Create a provider component
export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { address, isConnected, chain } = useAccount();
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { signMessageAsync } = useSignMessage();
  useEffect(() => {
    if (isConnected && address) {
      setIsLoading(true);
      let nonce = '';
      let signature = '';
      const authenticate = async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/auth/generate-nonce/${address}`
          );
          const result = await response.json();
          nonce = result.nonce;
        } catch (error) {
          console.error('Error fetching nonce:', error);
        }

        try {
          signature = await signMessageAsync({ message: nonce });
        } catch (error) {
          console.error('Error signing message:', error);
        }

        try {
          console.log(nonce);
          const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature }),
          });
          const result = await response.json();
          setAccessToken(result.accessToken);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      authenticate();
    }
  }, [address, chain, isConnected, signMessageAsync]);

  return (
    <AuthenticationContext.Provider value={{ accessToken, isLoading }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

// Custom hook to use the DataContext
export const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error(
      'useAuthentication must be used within a AuthenticationProvider'
    );
  }
  return context;
};
