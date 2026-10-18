'use client';

import { sessionExpiredLogout } from '@/lib/logout-client';

export async function callServerAction<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    console.log('callServerAction caught:', error?.message);
    
    // Check if it's a session expired error
    if (error?.message === 'SESSION_EXPIRED' || 
        error?.name === 'SESSION_EXPIRED' ||
        error?.message?.includes('LOGOUT_NOW')) {
      
      console.log('SESSION_EXPIRED detected in callServerAction');
      
      // Call sessionExpiredLogout immediately
      sessionExpiredLogout();
      
      // Return rejected promise
      return Promise.reject(error);
    }
    
    throw error;
  }
}