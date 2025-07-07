'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
  clearAuthAndReauth: () => void;
}

// JWT expiration check function
const isJWTExpired = (token: string | undefined): boolean => {
  if (!token) return true;

  try {
    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return true;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Check if exp claim exists
    if (!decodedPayload.exp) {
      console.warn('JWT does not contain exp claim');
      return true;
    }

    // Compare exp with current time (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decodedPayload.exp <= currentTime;

    console.log(
      'JWT exp:',
      decodedPayload.exp,
      'Current time:',
      currentTime,
      'Expired:',
      isExpired
    );
    return isExpired;
  } catch (error) {
    console.warn('Failed to decode JWT:', error);
    return true; // Treat as expired if we can't decode
  }
};

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

    // Check if the JWT token is expired
    if (isJWTExpired(authData.accessToken)) {
      console.log('Stored JWT token is expired, clearing storage');
      clearTokenFromStorage();
      return null;
    }

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

  // Function to clear authentication (simplified)
  const clearAuthAndReauth = useCallback(() => {
    clearTokenFromStorage();
    setAccessToken('');
    setIsAuthenticated(false);
  }, []);

  // Monitor token expiration with precise timeout
  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;

    // Calculate exact timeout until token expires
    try {
      const parts = accessToken.split('.');
      if (parts.length !== 3) return;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return;

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // If already expired, clear immediately
      if (timeUntilExpiration <= 0) {
        clearAuthAndReauth();
        return;
      }

      // Set timeout for exact expiration time
      const timeout = setTimeout(() => {
        console.log('⏰ Token expired, clearing authentication');
        clearAuthAndReauth();
      }, timeUntilExpiration);

      return () => clearTimeout(timeout);
    } catch (error) {
      console.warn('Failed to set token expiration timeout:', error);
    }
  }, [accessToken, isAuthenticated, clearAuthAndReauth]);

  useEffect(() => {
    // Reset authentication state when wallet disconnects
    if (!isConnected) {
      setAccessToken('');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    if (isConnected && address) {
      // If wallet is connected but not authenticated, start authentication

      const savedAuthData = loadTokenFromStorage();
      const isTokenExpired = isJWTExpired(savedAuthData?.accessToken);
      const tokenBelongsToWallet =
        savedAuthData?.walletAddress === address.toLowerCase();

      if (savedAuthData && !isTokenExpired && tokenBelongsToWallet) {
        setAccessToken(savedAuthData.accessToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated || !tokenBelongsToWallet) {
        setIsLoading(true);

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
    }
  }, [address, isConnected, signMessageAsync, isAuthenticated]);

  return (
    <AuthenticationContext.Provider
      value={{ accessToken, isLoading, isAuthenticated, clearAuthAndReauth }}
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
