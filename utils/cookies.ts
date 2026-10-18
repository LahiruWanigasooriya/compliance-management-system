import Cookies from 'js-cookie';

/**
 * Secure cookie configuration
 * Ensures all cookies are set with proper security settings
 */
const getSecureCookieOptions = (
  customOptions?: Cookies.CookieAttributes
): Cookies.CookieAttributes => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    sameSite: 'lax',
    secure: isProduction,
    ...customOptions,
  };
};

/**
 * Set a cookie with secure defaults
 */
export const setSecureCookie = (
  name: string,
  value: string,
  options?: Cookies.CookieAttributes
): void => {
  Cookies.set(name, value, getSecureCookieOptions(options));
};

/**
 * Get a cookie value
 */
export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

/**
 * Remove a cookie
 */
export const removeCookie = (name: string, options?: Cookies.CookieAttributes): void => {
  Cookies.remove(name, options);
};

/**
 * Remove all application cookies (useful for logout)
 */
export const clearAllCookies = (): void => {
  const allCookies = Cookies.get();
  Object.keys(allCookies).forEach((cookieName) => {
    // Don't remove Next.js and NextAuth cookies - they're handled by the framework
    if (
      !cookieName.startsWith('next-auth') &&
      !cookieName.startsWith('__Secure-next-auth') &&
      !cookieName.startsWith('__Host-next-auth')
    ) {
      Cookies.remove(cookieName);
    }
  });
};
