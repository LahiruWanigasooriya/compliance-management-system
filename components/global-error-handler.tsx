'use client';

import { useEffect } from 'react';
import { sessionExpiredLogout } from '@/lib/logout-client';

export default function GlobalErrorHandler() {
  useEffect(() => {
    console.log('GlobalErrorHandler mounted - listening for errors');
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('Unhandled rejection caught:', event.reason?.message);
      
      const error = event.reason;
      if (error?.message?.includes('SESSION_EXPIRED') || 
          error?.name === 'SESSION_EXPIRED' ||
          error?.message?.includes('LOGOUT_NOW') ||
          error?.response?.status === 401 ||
        error?.status === 401
      ) {
        event.preventDefault();
        console.log(' SESSION_EXPIRED detected, calling sessionExpiredLogout...');
        sessionExpiredLogout();
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      console.log(' Global error caught:', event.error?.message);
      
      const error = event.error;
      if (
        error?.message?.includes('SESSION_EXPIRED') || 
        error?.name === 'SESSION_EXPIRED' ||
        error?.message?.includes('LOGOUT_NOW')
      ) {
        event.preventDefault();
        console.log('SESSION_EXPIRED in global error, calling sessionExpiredLogout...');
        sessionExpiredLogout();
      }
    };

    // Store original console.error
    const originalConsoleError = console.error;
    
    // Override console.error
    console.error = (...args) => {
      const errorString = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Check if it contains SESSION_EXPIRED or LOGOUT_NOW
     if (
    (errorString.includes('SESSION_EXPIRED') || errorString.includes('LOGOUT_NOW')) &&
    !errorString.includes('Encountered two children with the same key')
  ) {
        console.log('Console error contains SESSION_EXPIRED/LOGOUT_NOW, calling sessionExpiredLogout...');
        // Use requestAnimationFrame instead of setTimeout for better timing
        requestAnimationFrame(() => {
          sessionExpiredLogout();
        });
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    console.log('Adding global error event listeners...');
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      console.log('Removing global error event listeners...');
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      
      // Restore original console.error
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}