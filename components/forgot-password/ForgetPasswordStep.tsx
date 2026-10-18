"use client";
import { forgetPassword } from "@/actions/auth.actions";
import React, { useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { Mail, AlertCircle } from "lucide-react";
function ForgetPasswordStep({ onNext }: { onNext: () => void }) {
  const [isLoading, startTransition] = useTransition();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [touched, setTouched] = React.useState(false);

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
        const response = await forgetPassword(email);
        if (response?.message) {
          Cookies.set("reset_password_email", email, {
            expires: 0.5,
          });
          localStorage.setItem("IsDonePasswordResetTimer", "false");

          toast.success(response?.message || "Password reset initiated!");
          onNext();
        }
      } catch (err: unknown) {
        let message = "Failed to initiate MFA setup";

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

  return (
    <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full  max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Forgot Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email to reset your password
        </p>
      </div>

      <form className="flex flex-col mt-13 gap-10">
        {/* Email Field */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="mfa-email"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="email"
              id="mfa-email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={(e) => {
                if (e.key === "Enter" && email) handleSubmit();
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                touched && error
                  ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              }`}
              placeholder="you@example.com"
            />
          </div>
          {touched && error && (
            <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isLoading || !email}
          onClick={handleSubmit}
          className="bg-primary dark:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
        >
          {isLoading ? (
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
              Sending Code...
            </span>
          ) : (
            "Send OTP Code"
          )}
        </button>

        {/* Info Message */}
        <div className="text-center mt-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Check your spam folder if you don't see the email
          </p>
        </div>
      </form>
    </div>
  );
}

export default ForgetPasswordStep;
