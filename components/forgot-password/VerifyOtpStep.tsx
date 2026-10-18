"use client";
import { verifyOtp, forgetPassword } from "@/actions/auth.actions";
import React, { useEffect, useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const TIMER_KEY = "reset_password_otp_timer_end";
const IsDoneTimer = "IsDonePasswordResetTimer";
const COUNTDOWN_DURATION = 2 * 60; // 2 minutes

function VerifyOtpStep({ onNext }: { onNext: () => void }) {
  const [isLoadingVerify, startTransitionVerify] = useTransition();
  const [isLoadingResend, startTransitionResend] = useTransition();

  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();

  const [timeRemaining, setTimeRemaining] = React.useState(() => {
    // Initialize time remaining from localStorage or start new countdown
    const savedTimerEnd = localStorage.getItem(TIMER_KEY);
    if (savedTimerEnd) {
      const endTime = parseInt(savedTimerEnd, 10);
      const now = Date.now();
      return Math.max(0, Math.floor((endTime - now) / 1000));
    }

    if (localStorage.getItem(IsDoneTimer) === "false") {
      const endTime = Date.now() + COUNTDOWN_DURATION * 1000;
      localStorage.setItem(TIMER_KEY, endTime.toString());
      return COUNTDOWN_DURATION;
    }

    return 0;
  });

  const startCountdown = () => {
    const endTime = Date.now() + COUNTDOWN_DURATION * 1000;
    localStorage.setItem(TIMER_KEY, endTime.toString());
    setTimeRemaining(COUNTDOWN_DURATION);
  };

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          localStorage.removeItem(TIMER_KEY);
          localStorage.setItem(IsDoneTimer, "true");
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const validateCode = (code: string): string | undefined => {
    if (!code) return "Verification code is required";
    if (code.length !== 6) return "Code must be 6 digits";
    if (!/^\d+$/.test(code)) return "Code must contain only numbers";
    return undefined;
  };

  const handleCodeChange = (value: string) => {
    const filtered = value.replace(/\D/g, "").slice(0, 6);
    setCode(filtered);
    if (error) setError(validateCode(filtered));
  };

  const handleResendCode = () => {
    startTransitionResend(async () => {
      try {
        const email = Cookies.get("reset_password_email");
        if (!email) {
          toast.error("Session expired. Please start over.");
          return;
        }
        const response = await forgetPassword(email);
        if (response?.message) {
          toast.success(response?.message || "New code sent successfully!");
          localStorage.setItem(IsDoneTimer, "false");
          startCountdown();
        }
      } catch (err: unknown) {
        let message = "Failed to resend OTP code";

        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data;
          if (errorData) {
            if (typeof errorData === "string") {
              message = errorData;
            } else if ("message" in errorData) {
              message = (errorData as any).message;
            } else if ("error" in errorData) {
              message = (errorData as any).error;
            }
          }
        }
        setError(message);
        toast.error(message);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = () => {
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    startTransitionVerify(async () => {
      try {
        const email = Cookies.get("reset_password_email");
        if (!email) {
          toast.error("Email not found. Please try again.");
          return;
        }
        const response = await verifyOtp(email, code);
        if (response?.valid) {
          Cookies.set("reset_token", response.reset_token, {
            expires: 0.5,
          });
          localStorage.removeItem(TIMER_KEY);
          localStorage.removeItem(IsDoneTimer);
          toast.success(response?.message || "Let's secure your account!");
          onNext();
        }
      } catch (err: unknown) {
        let message = "Failed to verify email OTP";

        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data;
          if (errorData) {
            if (typeof errorData === "string") {
              message = errorData;
            } else if ("message" in errorData) {
              message = (errorData as any).message;
            } else if ("error" in errorData) {
              message = (errorData as any).error;
            }
          }
        }
        toast.error(message);
      }
    });
  };

  const isResendDisabled = timeRemaining > 0 || isLoadingResend;

  return (
    <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full  h-120 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Verify OTP
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          We sent a 6-digit code to your email
        </p>
      </div>

      <form className="flex flex-col mt-10 md:mt-13 gap-6">
        {/* OTP Code Field */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="otp-code"
          >
            Verification Code
          </label>
          <input
            type="text"
            id="otp-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && code.length === 6) handleVerify();
            }}
            className={`w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
              error
                ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
            }`}
            placeholder="000000"
            maxLength={6}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && code.length === 6 && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Code is ready to verify</span>
          </div>
        )}

        {/* Verify Button */}
        <button
          type="button"
          disabled={isLoadingVerify || code.length !== 6 || isLoadingResend}
          onClick={handleVerify}
          className="bg-primary dark:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoadingVerify ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            "Verify Code"
          )}
        </button>

        {/* Resend OTP Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="text-center mb-3">
            {timeRemaining > 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Request new code in{" "}
                <span className="font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Didn't receive the code?
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isResendDisabled || isLoadingVerify}
            onClick={handleResendCode}
            className="w-full flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingResend ? "animate-spin" : ""}`}
            />
            {isLoadingResend ? "Sending OTP..." : "Resend OTP"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VerifyOtpStep;
