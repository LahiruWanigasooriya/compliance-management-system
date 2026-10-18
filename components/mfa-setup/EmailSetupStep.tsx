"use client";
import { setupMfaEmail } from "@/actions/auth.actions";
import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { Mail, AlertCircle, ArrowRight } from "lucide-react";

function EmailSetupStep({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [touched, setTouched] = React.useState(false);
  const [isLoading, startTransition] = useTransition();
  const navigate = useRouter();

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = () => {
    setTouched(true);
    const validationError = validateEmail(email);

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const sessionToken = Cookies.get("session_token");
        Cookies.set("email", email, { expires: 0.5 });

        if (!sessionToken) {
          toast.error("Session expired. Please start over.");
          navigate.push("/login");
          return;
        }

        const response = await setupMfaEmail(sessionToken, email);
        if (response?.method_id) {
          Cookies.set("method_id", response.method_id, { expires: 0.5 });
          toast.success("Verification code sent to your email!");
          localStorage.setItem("IsDoneMfaSetupTimer", "false");
          onNext();
        }
      } catch (err: unknown) {
        let message = "Failed to setup email MFA";
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

  return (
    <div className="flex flex-col items-center gap-6 w-full  mx-auto p-6">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Email Verification
        </h2>
        <p className="text-blue-100 text-sm">
          Enter your email address to receive a verification code
        </p>
      </div>

      <div className="w-full">
        <label
          className="block text-white text-sm font-medium mb-3"
          htmlFor="mfa-email"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            id="mfa-email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={(e) => {
              if (e.key === "Enter" && email) handleSubmit();
            }}
            className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-gray-800 ${
              touched && error
                ? "border-red-500 focus:ring-red-500/20 bg-red-50"
                : "border-gray-300 focus:ring-blue-500/20 bg-white"
            }`}
            placeholder="you@example.com"
          />
        </div>
        {touched && error && (
          <div className="flex items-center gap-2 mt-3 text-red-200 text-sm bg-red-500/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={isLoading || !email}
        onClick={handleSubmit}
        className="w-full bg-white text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 group"
      >
        {isLoading ? (
          <>
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
            Sending Code...
          </>
        ) : (
          <>
            Send Verification Code
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="bg-blue-500/20 rounded-lg p-4 w-full">
        <p className="text-blue-100 text-xs text-center">
          Make sure to check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
}

export default EmailSetupStep;
