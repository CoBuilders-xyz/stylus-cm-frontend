'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { API_URL } from '../utils/env';

// localStorage key for storing authentication data
const AUTH_TOKEN_KEY = 'arb_cache_auth_token';

// Interface for stored authentication data
interface StoredAuthData {
  accessToken: string;
  walletAddress: string;
}

// Define the shape of the context data
interface AuthenticationContextType {
  accessToken: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// localStorage utility functions
const saveTokenToStorage = (token: string, walletAddress: string): void => {
  try {
    const authData: StoredAuthData = {
      accessToken: token,
      walletAddress: walletAddress.toLowerCase(),
    };
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authData));
  } catch (error) {
    console.warn('Failed to save token to localStorage:', error);
  }
};

const loadTokenFromStorage = (): StoredAuthData | null => {
  try {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored) return null;

    const authData: StoredAuthData = JSON.parse(stored);

    return authData;
  } catch (error) {
    console.warn('Failed to load token from localStorage:', error);
    clearTokenFromStorage();
    return null;
  }
};

const clearTokenFromStorage = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear token from localStorage:', error);
  }
};

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

      const savedAuthData = loadTokenFromStorage();

      if (savedAuthData) {
        setAccessToken(savedAuthData.accessToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

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
          saveTokenToStorage(result.accessToken, address);
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
