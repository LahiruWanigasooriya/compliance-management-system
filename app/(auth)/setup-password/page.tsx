"use client";
import { setupPassword } from "@/actions/auth.actions";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useTransition, useEffect, Suspense } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

function SetupPasswordForm() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouched] = React.useState<{
    password: boolean;
    confirmPassword: boolean;
  }>({
    password: false,
    confirmPassword: false,
  });

  const navigate = useRouter();
  const [isLoggingIn, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const password_setup_token = searchParams.get("password_setup_token");

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return undefined;
  };

  // Confirm password validation
  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ): string | undefined => {
    if (!confirmPassword) return "Confirm password is required";
    if (confirmPassword !== password) return "Passwords do not match";
    return undefined;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };
    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  // Handle field blur
  const handleBlur = (field: "password" | "confirmPassword") => {
    setTouched({ ...touched, [field]: true });
    if (field === "password") {
      setErrors({ ...errors, password: validatePassword(password) });
    } else if (field === "confirmPassword") {
      setErrors({
        ...errors,
        confirmPassword: validateConfirmPassword(confirmPassword, password),
      });
    }
  };

  const handleLogin = () => {
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    if (!password_setup_token) {
      toast.error("Invalid setup token. Please try again.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await setupPassword(
          password_setup_token,
          password
        );
        if (response) {
          if (response.mfa_setup_token) {
            toast.success(response.message);
            navigate.push(
              `/mfa-setup?mfa_setup_token=${response.mfa_setup_token}`
            );
            return;
          }
          
          // For all other successful cases, show success and go to login
          toast.success("Password set up successfully! You can now login.");
          navigate.push(`/login`);

        }
      } catch (err: unknown) {
        let message = "Setup password failed. Please try again.";

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
        console.log(" error:", message);
        toast.error(message);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-linear-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800 p-4 min-h-screen">
      <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Setup Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new password for your account
          </p>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* Password Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    setErrors({
                      ...errors,
                      password: validatePassword(e.target.value),
                    });
                  }
                  if (touched.confirmPassword) {
                    setErrors({
                      ...errors,
                      confirmPassword: validateConfirmPassword(
                        confirmPassword,
                        e.target.value
                      ),
                    });
                  }
                }}
                onBlur={() => handleBlur("password")}
                value={password}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.password && errors.password
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) {
                    setErrors({
                      ...errors,
                      confirmPassword: validateConfirmPassword(
                        e.target.value,
                        password
                      ),
                    });
                  }
                }}
                onBlur={() => handleBlur("confirmPassword")}
                value={confirmPassword}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.confirmPassword && errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="bg-primary dark:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isLoggingIn ? (
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
                Submitting...
              </span>
            ) : (
              "Set Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}
