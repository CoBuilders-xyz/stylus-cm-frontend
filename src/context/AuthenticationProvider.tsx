'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { API_URL } from '../utils/env';

// Define the shape of the context data
interface AuthenticationContextType {
  accessToken: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create the context
const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

// Create a provider component
export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    // Reset authentication state when wallet disconnects
    if (!isConnected) {
      setAccessToken('');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    if (isConnected && address) {
      setIsLoading(true);
      setIsAuthenticated(false);

      let nonce = '';
      let signature = '';
      const authenticate = async () => {
        try {
          const response = await fetch(
            `${API_URL}/auth/generate-nonce/${address}`
          );
          const result = await response.json();
          nonce = result.nonce;
        } catch (error) {
          console.error('Error fetching nonce:', error);
          setIsLoading(false);
          return;
        }

        try {
          signature = await signMessageAsync({ message: nonce });
        } catch (error) {
          console.error('Error signing message:', error);
          setIsLoading(false);
          return;
        }

        try {
          console.log(
            'Authenticating with signature:',
            signature.substring(0, 10) + '...'
          );
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature }),
          });

          if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
          }

          const result = await response.json();
          setAccessToken(result.accessToken);
          setIsAuthenticated(true);
          console.log('Authentication completed successfully');
        } catch (error) {
          console.error('Error authenticating:', error);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      };

      authenticate();
    }
  }, [address, isConnected, signMessageAsync]); // Add chain for reloading on chain change.

  return (
    <AuthenticationContext.Provider
      value={{ accessToken, isLoading, isAuthenticated }}
    >
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
