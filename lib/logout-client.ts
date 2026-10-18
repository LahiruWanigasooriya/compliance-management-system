'use client';

import { APPLICATION } from "@/constants/application";
import { LOCAL_STORAGE_KEYS_TO_REMOVE } from "@/constants/auth.constants";
import Cookies from 'js-cookie';
import { toast } from 'sonner';

// Constants
const LOGOUT_ENDPOINT = `${APPLICATION.BASE_URL}/api/v1/auth/logout`;

// Helper functions
const getAuthTokens = () => {
  const accessToken = Cookies.get('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const tenantId = Cookies.get('X-Tenant-ID') || APPLICATION.TENANT_ID;
  
  console.log(' Token Status:', {
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.length,
    hasRefreshToken: !!refreshToken,
    refreshTokenLength: refreshToken?.length,
    tenantId
  });
  
  return { accessToken, refreshToken, tenantId };
};

const clearAllClientStorage = () => {
  console.log(' Clearing client storage...');
  
  // Clear cookies
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('X-Tenant_ID');
  Cookies.remove('X-User-ID');
  Cookies.remove('X-User-Type')
    
  LOCAL_STORAGE_KEYS_TO_REMOVE.forEach(item => {
    localStorage.removeItem(item);
    console.log(` Removed: ${item}`);
  });
  
  console.log(' Client storage cleared');
};

const callLogoutAPI = async (accessToken: string, refreshToken: string, tenantId: string) => {
  console.log(' Calling logout API...');
  console.log(' Request Details:', {
    endpoint: LOGOUT_ENDPOINT,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: { refresh_token: `${refreshToken.substring(0, 10)}...` }
  });
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(LOGOUT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });
    
    const duration = Date.now() - startTime;
    console.log(` API Response (${duration}ms):`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.warn(' Logout API returned non-OK status:', response.status);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.warn('Error details:', errorData);
      } catch {
        console.warn('No error details available');
      }
    } else {
      console.log(' Logout API call successful');
      
      // Log success response if any
      try {
        const successData = await response.json();
        console.log('Success response:', successData);
      } catch {
        // No response body is fine
      }
    }
    
    return { success: response.ok, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Logout API call failed after ${duration}ms:`, {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0]
    });
    throw error;
  }
};

const callLogoutAPIFireAndForget = (accessToken: string, refreshToken: string, tenantId: string) => {
  console.log(' Calling logout API (fire and forget)...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('Logout API timeout after 2 seconds');
    controller.abort();
  }, 1000);
  
  const startTime = Date.now();
  
  fetch(LOGOUT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Tenant-ID': tenantId
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    signal: controller.signal
  })
    .then(response => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(` Logout API completed (${duration}ms):`, {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        console.log(' Fire-and-forget logout returned non-OK:', response.status);
      }
    })
    .catch(err => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(` Logout API failed (${duration}ms):`, {
        message: err.message,
        aborted: err.name === 'AbortError'
      });
    })
    .finally(() => {
      console.log(' Fire-and-forget logout attempt completed');
    });
};

const redirectToLogin = (isSessionExpired = false) => {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/login';
  
  if (!isLoginPage) {
    const redirectUrl = isSessionExpired 
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : '/login';
    
    console.log(` Redirecting to: ${redirectUrl}`);
    
    if (isSessionExpired) {
      // Give time for toast to be seen
      setTimeout(() => {
        console.log(' Executing redirect...');
        window.location.replace(redirectUrl);
      }, 1000);
    } else {
      console.log(' Executing immediate redirect...');
      window.location.replace(redirectUrl);
    }
  } else {
    console.log('Already on login page, skipping redirect');
  }
};

/**
 * Client-side logout function with API integration
 * Use this for manual logout (user clicks logout button)
 */
export async function clientLogout() {
  console.group(' CLIENT LOGOUT STARTED');
  console.log(' Timestamp:', new Date().toISOString());
  
  try {
    // Get tokens before clearing them
    const { accessToken, refreshToken, tenantId } = getAuthTokens();
    
    // Show toast for manual logout
    toast.success('Logging out...');
    console.log(' Toast shown: "Logging out..."');
    
    // Call logout API if we have both tokens
    if (accessToken && refreshToken) {
      console.log(' Both tokens available, calling logout API');
      await callLogoutAPI(accessToken, refreshToken, tenantId);
    } else {
      console.log(' Missing tokens, skipping API call:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
    }
    
    // Clear client-side storage
    clearAllClientStorage();
    
    // Redirect to login
    redirectToLogin(false);
    
  } catch (error) {
    console.error('❌ Client logout error (continuing anyway):', error);
    
    // Even if API call fails, continue with client-side logout
    clearAllClientStorage();
    redirectToLogin(false);
  }
  
  console.groupEnd();
  console.log(' CLIENT LOGOUT COMPLETED');
}

/**
 * Session expired logout (for automatic logout when tokens expire)
 * Shows "session expired" message instead of "logging out"
 */
export async function sessionExpiredLogout() {
  console.group(' SESSION EXPIRED LOGOUT STARTED');
  console.log(' Timestamp:', new Date().toISOString());
  
  try {
    // Get tokens before clearing them
    const { accessToken, refreshToken, tenantId } = getAuthTokens();
    
    // Show session expired message
    toast.error('Your session has expired. Please log in again.');
    console.log(' Toast shown: "Your session has expired. Please log in again."');
    
    // Try to call logout API (fire and forget - don't wait for response)
    if (accessToken && refreshToken) {
      console.log(' Both tokens available, attempting fire-and-forget logout API');
      callLogoutAPIFireAndForget(accessToken, refreshToken, tenantId);
    } else {
      console.log(' Missing tokens, skipping API call:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
    }
    
    // Clear client-side storage
    clearAllClientStorage();
    
    // Redirect to login with delay
    redirectToLogin(true);
    
  } catch (error) {
    console.error('❌ Session expired logout error:', error);
    
    // Clear storage anyway
    clearAllClientStorage();
    redirectToLogin(true);
  }
  
  console.groupEnd();
  console.log(' SESSION EXPIRED LOGOUT COMPLETED');
}
