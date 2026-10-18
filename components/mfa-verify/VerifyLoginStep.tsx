"use client";
import { sendMfaCode, verifyMfaLogin } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import React, { useEffect, useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
// import { useSession } from "next-auth/react";
import { Shield, RefreshCw, AlertCircle, CheckCircle, Key } from "lucide-react";
import { useAuth } from "../providers/auth.provider";
// import { signIn } from "@/auth";
// import { signIn } from "next-auth/react";

const TIMER_KEY = "mfa_verify_timer_end";
const IsDoneTimer = "IsDoneMfaVerifyTimer";
const COUNTDOWN_DURATION = 10 * 60; // 10 minutes

function VerifyLoginStep({ onVerifySuccess }: { onVerifySuccess: () => void }) {
  const authContext = useAuth()
  const {signIn} = authContext;
  const [code, setCode] = React.useState("");
  const [useBackupCode, setUseBackupCode] = React.useState(false);
  const [isLoadingVerify, startTransitionVerify] = useTransition();
  const [isLoadingResend, startTransitionResend] = useTransition();

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
  const [error, setError] = React.useState<string | undefined>();
  const navigate = useRouter();
  // const { update } = useSession();

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

  const validateCode = (
    code: string,
    isBackup: boolean
  ): string | undefined => {
    if (!code) return "Code is required";
    if (isBackup) {
      if (code.length < 6) return "Backup code is too short";
    } else {
      if (code.length !== 6) return "Code must be 6 digits";
      if (!/^\d+$/.test(code)) return "Code must contain only numbers";
    }
    return undefined;
  };

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      setCode(value.slice(0, 20));
    } else {
      const filtered = value.replace(/\D/g, "").slice(0, 6);
      setCode(filtered);
    }
    if (error) setError(validateCode(value, useBackupCode));
  };

  const handleResendCode = () => {
    startTransitionResend(async () => {
      try {
        const mfaSessionToken = Cookies.get("mfa_session_token");
        const methodId = Cookies.get("mfa_method_id");

        if (!mfaSessionToken) {
          toast.error("Session expired. Please login again.");
          navigate.push("/login");
          return;
        }

        const response = await sendMfaCode(mfaSessionToken, methodId);
        if (response?.success) {
          toast.success("New code sent successfully!");
          localStorage.setItem(IsDoneTimer, "false");
          startCountdown();
        }
      } catch (err: unknown) {
        let message = "Failed to send code";
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

  const handleVerify = () => {
    const validationError = validateCode(code, useBackupCode);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    startTransitionVerify(async () => {
      try {
        const mfaSessionToken = Cookies.get("mfa_session_token");
        if (!mfaSessionToken) {
          toast.error("Session expired. Please login again.");
          navigate.push("/login");
          return;
        }

        const response = await verifyMfaLogin(
          mfaSessionToken,
          code,
          useBackupCode
        );
        if (response?.success && response?.access_token) {
          // await signIn("credentials", {
          //   accessToken: response.access_token,
          //   refreshToken: response.refresh_token,
          //   user: JSON.stringify(response.user),
          //   redirect: false,
          // });
          signIn(
            response.access_token,
            response.refresh_token,
            response.user
          );

          console.log("MFA verify response:", response);

          // Clean up MFA-related cookies
          Cookies.remove("mfa_session_token");
          Cookies.remove("mfa_method_id");
          localStorage.removeItem(IsDoneTimer);
          localStorage.removeItem(TIMER_KEY);

          onVerifySuccess();
          toast.success("Welcome back!");
          navigate.push("/");
        }
      } catch (err: unknown) {
        let message = "Invalid verification code";
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

  const isResendDisabled = timeRemaining > 0 || isLoadingResend;

  return (
    <div className="flex flex-col items-center gap-6 w-full  mx-auto p-6">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Multi-Factor Authentication
        </h2>
        <p className="text-blue-100 text-sm">
          {useBackupCode
            ? "Enter your backup code"
            : "Enter the code from your authenticator"}
        </p>
      </div>

      <div className="w-full">
        <label className="block text-white text-sm font-medium mb-3 text-center">
          {useBackupCode ? "Backup Code" : "Verification Code"}
        </label>
        <div className="relative">
          {useBackupCode && (
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          )}
          <input
            type="text"
            inputMode={useBackupCode ? "text" : "numeric"}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && code) handleVerify();
            }}
            className={`w-full ${
              useBackupCode
                ? "pl-12 text-base"
                : "text-center text-2xl tracking-widest"
            } pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all font-mono ${
              error
                ? "border-red-500 focus:ring-red-500/20 bg-red-50"
                : "border-gray-300 focus:ring-blue-500/20 bg-white"
            }`}
            placeholder={useBackupCode ? "Enter backup code" : "000000"}
            maxLength={useBackupCode ? 20 : 6}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-200 text-sm bg-red-500/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {!error && code && (useBackupCode || code.length === 6) && (
          <div className="flex items-center gap-2 mt-3 text-green-200 text-sm bg-green-500/20 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Ready to verify</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full bg-white/10 p-3 rounded-lg">
        <input
          type="checkbox"
          id="useBackup"
          checked={useBackupCode}
          onChange={(e) => {
            setUseBackupCode(e.target.checked);
            setCode("");
            setError(undefined);
          }}
          className="w-4 h-4 rounded cursor-pointer accent-blue-600"
        />
        <label
          htmlFor="useBackup"
          className="text-white text-sm cursor-pointer flex-1"
        >
          Use a backup code instead
        </label>
      </div>

      <button
        type="button"
        disabled={isLoadingVerify || !code || isLoadingResend}
        onClick={handleVerify}
        className="w-full bg-white text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          "Verify & Sign In"
        )}
      </button>

      {!useBackupCode && (
        <div className="w-full border-t border-white/20 pt-4">
          <div className="text-center mb-3">
            {timeRemaining > 0 ? (
              <p className="text-blue-100 text-sm">
                Request new code in{" "}
                <span className="font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </p>
            ) : (
              <p className="text-blue-100 text-sm">Didn't receive the code?</p>
            )}
          </div>
          <button
            type="button"
            disabled={isResendDisabled || isLoadingVerify}
            onClick={handleResendCode}
            className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-3 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingResend ? "animate-spin" : ""}`}
            />
            {isLoadingResend ? "Sending..." : "Resend Code"}
          </button>
        </div>
      )}
    </div>
  );
}

export default VerifyLoginStep;
