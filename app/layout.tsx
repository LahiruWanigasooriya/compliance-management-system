import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { ThemeProvider } from '../components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
// import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/components/providers/auth.provider';
import { TenantProvider } from '@/components/providers/tenant.provider';
import { NotificationProvider } from '@/components/providers/notification.provider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import GlobalErrorHandler from '@/components/global-error-handler';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vesant.ai',
  description: 'Compliance Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
        {/* <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}> */}
          <Toaster position="top-right" />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
               <GlobalErrorHandler />
              <TenantProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </TenantProvider>
            </AuthProvider>
          </ThemeProvider>
        {/* </SessionProvider> */}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
