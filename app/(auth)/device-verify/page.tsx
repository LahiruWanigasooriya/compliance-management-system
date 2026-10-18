'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { verifyDevice } from '@/actions/auth.actions';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function DeviceVerifyPage() {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  // Guard: prevent direct access without token
  useEffect(() => {
    const token = Cookies.get('device_verification_token');
    if (!token) {
      toast.error('Verification session expired. Please login again.');
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    const deviceVerificationToken = Cookies.get('device_verification_token');

    if (!deviceVerificationToken) {
      toast.error('Verification session expired. Please login again.');
      router.push('/login');
      return;
    }

    try {
      setIsVerifying(true);

      const res = await verifyDevice(
        otp,
        deviceVerificationToken,
        true
      );

      // Store tokens if returned
      if (res.access_token) {
        Cookies.set('accessToken', res.access_token);
      }
      if (res.refresh_token) {
        localStorage.setItem('refreshToken', res.refresh_token);
      }

      Cookies.remove('device_verification_token');

      toast.success('Device verified successfully');
      router.push('/');
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (axiosError?.response?.status === 400) {
        toast.error("Invalid code. Please try again.");
      } else {
        const message =
          axiosError?.response?.data?.message ||
          "Something went wrong. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Verify Your Device
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          Enter the 6-digit code sent to your email
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            After verification, this device will be trusted and you won't need
            to verify it again.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value:string) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isVerifying ? 'Verifying...' : 'Verify Device'}
          </button>
        </form>
      </div>
    </div>
  );
}
