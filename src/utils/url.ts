/**
 * Centralized Application URL Configuration
 * Resolves the canonical base URL for transactional emails, webhooks, 
 * password resets, and verification links.
 */

export const getAppBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    // If running in production browser on a domain (not bare localhost/127.0.0.1)
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      return window.location.origin;
    }
  }
  return (import.meta as any).env?.VITE_APP_URL || 'https://growpot.cloud';
};

export const APP_BASE_URL = getAppBaseUrl();
