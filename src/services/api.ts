import { API_URL } from '@/utils/env';

/**
 * Base API client for handling HTTP requests with authentication
 */
export class ApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make a GET request to the API
   * @param endpoint The API endpoint to call
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * Make a POST request to the API
   * @param endpoint The API endpoint to call
   * @param data The data to send in the request body
   * @returns Promise with the response data
   */
  async post<T, D = Record<string, unknown>>(
    endpoint: string,
    data?: D
  ): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * Make a PUT request to the API
   * @param endpoint The API endpoint to call
   * @param data The data to send in the request body
   * @returns Promise with the response data
   */
  async put<T, D = Record<string, unknown>>(
    endpoint: string,
    data?: D
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * Make a PATCH request to the API
   * @param endpoint The API endpoint to call
   * @param data The data to send in the request body
   * @returns Promise with the response data
   */
  async patch<T, D = Record<string, unknown>>(
    endpoint: string,
    data?: D
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, data);
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint The API endpoint to call
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Generic request method to handle all HTTP requests
   * @param method The HTTP method to use
   * @param endpoint The API endpoint to call
   * @param data Optional data to send in the request body
   * @returns Promise with the response data
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle different error status codes
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // For 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`API request failed: ${error.message}`);
      } else {
        console.error('An unknown error occurred during API request');
      }
      throw error;
    }
  }
}
