"use client";
import { setupMfaEmail, verifyMfaSetup } from "@/actions/auth.actions";
import React, { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const TIMER_KEY = "mfa_setup_timer_end";
const IsDoneTimer = "IsDoneMfaSetupTimer";
const COUNTDOWN_DURATION = 10 * 60; // 10 minutes

function VerifyCodeStep({
  onNext,
  methodType,
}: {
  onNext: (backupCodes: string[]) => void;
  methodType: string;
}) {
  const [code, setCode] = React.useState("");
  const [isLoadingResend, startTransitionResend] = useTransition();
  const [isLoadingVerify, startTransitionVerify] = useTransition();
  const [timeRemaining, setTimeRemaining] = React.useState(() => {
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
        const sessionToken = Cookies.get("session_token");
        const email = Cookies.get("email");
        if (!sessionToken || !email) {
          toast.error("Session expired. Please start over.");
          navigate.push("/login");
          return;
        }
        const response = await setupMfaEmail(sessionToken, email);
        if (response?.method_id) {
          Cookies.set("method_id", response.method_id, { expires: 0.5 });
          toast.success("New code sent to your email");
          localStorage.setItem(IsDoneTimer, "false");
          startCountdown();
        }
      } catch (err: unknown) {
        let message = "Failed to resend code";
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
        const sessionToken = Cookies.get("session_token");
        const methodId = Cookies.get("method_id");
        if (!sessionToken || !methodId) {
          toast.error("Session expired. Please start over.");
          navigate.push("/login");
          return;
        }
        const response = await verifyMfaSetup(sessionToken, methodId, code);
        if (response?.success && response?.backup_codes) {
          Cookies.set("backup_codes", JSON.stringify(response.backup_codes), {
            expires: 0.5,
          });
          toast.success("Verification successful!");
          localStorage.removeItem(TIMER_KEY);
          localStorage.removeItem(IsDoneTimer);
          onNext(response.backup_codes);
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

  const isResendDisabled = timeRemaining > 0 || isLoadingResend;

  return (
    <div className="flex flex-col items-center gap-6 w-full  mx-auto p-6">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          <h2 className="text-2xl font-bold text-white mb-2">
            Verify Your{" "}
            {methodType.charAt(0).toUpperCase() + methodType.slice(1)}
          </h2>
        </h2>
        <p className="text-blue-100 text-sm">
          We've sent a 6-digit code to your {methodType}
        </p>
      </div>

      <div className="w-full">
        <label className="block text-white text-sm font-medium mb-3 text-center">
          Enter Verification Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && code.length === 6) handleVerify();
          }}
          className={`w-full text-center text-2xl font-mono tracking-widest p-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
            error
              ? "border-red-500 focus:ring-red-500/20 bg-red-50"
              : "border-gray-300 focus:ring-blue-500/20 bg-white"
          }`}
          placeholder="000000"
          maxLength={6}
        />
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-200 text-sm bg-red-500/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {!error && code.length === 6 && (
          <div className="flex items-center gap-2 mt-3 text-green-200 text-sm bg-green-500/20 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Code is ready to verify</span>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={isLoadingVerify || code.length !== 6 || isLoadingResend}
        onClick={handleVerify}
        className="w-full bg-white text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
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
        {/* <button
          type="button"
          disabled={isResendDisabled || isLoadingVerify}
          onClick={handleResendCode}
          className="w-full flex items-center justify-center gap-2 text-white text-sm font-medium py-3 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingResend ? "animate-spin" : ""}`}
          />
          {isLoadingResend ? "Sending..." : "Resend Code"}
        </button> */}
      </div>
    </div>
  );
}

export default VerifyCodeStep;
