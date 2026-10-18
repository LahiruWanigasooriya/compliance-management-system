"use client";
import { loginUser } from "@/actions/auth.actions";
// import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useTransition, useEffect, Suspense } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { setSecureCookie } from "@/utils/cookies";
import { useAuth } from "@/components/providers/auth.provider";
import { isSystemConsole } from "@/utils/functions";
import Cookies from "js-cookie";

interface ValidationErrors {
  email?: string;
  password?: string;
}

function LoginForm() {
  const authContext = useAuth();
  const { signIn } = authContext;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouched] = React.useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false,
  });
  const [accountLocked, setAccountLocked] = React.useState(false);
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingIn, startTransition] = useTransition();
  const sessionExpired =
    searchParams.get("error") === "session_expired" ||
    searchParams.get("session_expired") === "true";
  const isFirstTimeLogin = searchParams.get("from") === "registration";

  useEffect(() => {
    if (sessionExpired) {
      toast.error(
        "Your session has expired due to inactivity. Please log in again.",
      );
    }
  }, [sessionExpired]);

useEffect(() => {
  if (typeof window !== "undefined") {
    const userType = isSystemConsole() ? "system" : "tenant";
    localStorage.setItem("devUserType", userType);
  }
}, []);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return undefined;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // Handle field blur
  const handleBlur = (field: "email" | "password") => {
    setTouched({ ...touched, [field]: true });
    if (field === "email") {
      setErrors({ ...errors, email: validateEmail(email) });
    } else {
      setErrors({ ...errors, password: validatePassword(password) });
    }
  };

  const handleLogin = () => {
    setAccountLocked(false);

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    startTransition(async () => {
      try {
        const isLoggRes = await loginUser(email, password);
        const isLogged = isLoggRes?.data?.data;
        console.log("isLogged", isLogged);
        if (isLogged) {
          if (
            isLogged.requires_password_setup === true &&
            isLogged.password_setup_token
          ) {
            navigate.push(
              `/setup-password?password_setup_token=${isLogged.password_setup_token}`,
            );
            return;
          }

          // Scenario 1: Device verification required (takes priority over MFA)
          if (
            isLogged.requires_device_verification === true &&
            isLogged.device_verification_token
          ) {
            setSecureCookie(
              "device_verification_token",
              isLogged.device_verification_token,
              { expires: 10 / (24 * 60) }, // 10 minutes
            );

            navigate.push("/device-verify");
            return;
          }

          // Scenario 2: User has MFA setup and needs to verify
          if (isLogged.requires_mfa === true && isLogged.mfa_session_token) {
            setSecureCookie("mfa_session_token", isLogged.mfa_session_token, {
              expires: 5 / (24 * 60),
            });
            const mfaMethodsParam = encodeURIComponent(
              JSON.stringify(isLogged.mfa_method_details || []),
            );
            navigate.push(`/mfa-verify?mfa_methods=${mfaMethodsParam}`);
            return;
          }

          // Scenario 3: User needs to setup MFA
          if (
            isLogged.requires_mfa_setup === true &&
            isLogged.mfa_setup_token
          ) {
            navigate.push(
              `/mfa-setup?mfa_setup_token=${isLogged.mfa_setup_token}`,
            );
            return;
          }

          // Scenario 4: Direct login without MFA (tokens returned directly)
          if (
            isLogged.requires_mfa === false &&
            isLogged.requires_mfa_setup === false &&
            isLogged.requires_device_verification !== true &&
            isLogged.requires_password_setup !== true &&
            isLogged.access_token &&
            isLogged.refresh_token
          ) {
            console.log("Proceeding with direct login with nextauth...");

            Cookies.set("refreshToken", isLogged.refresh_token, {
              path: "/",
            });
            localStorage.setItem("refreshToken", isLogged.refresh_token);
            //   console.log(" Tokens saved:", {
            //   accessToken: isLogged.access_token?.substring(0, 30) + '...',
            //   refreshToken: isLogged.refresh_token?.substring(0, 30) + '...'
            // });
            // Sign in with NextAuth using tokens (avoid second API call)
            // const result = await signIn("credentials", {
            //   accessToken: isLogged.access_token,
            //   refreshToken: isLogged.refresh_token,
            //   redirect: false,
            // });
            signIn(
              isLogged.access_token,
              isLogged.refresh_token,
              isLogged.user,
            );

            // Use full page reload to ensure cookies are properly sent to server
            // This is more reliable than router.push() for cookie synchronization
            const redirectTo = searchParams.get("from") || "/";
            window.location.href = redirectTo;
            return;
          }

          // Fallback: navigate to home
          navigate.push("/");
          return;
        }
      } catch (err: any) {
        console.log("Login error caught:", err.response.data);
        let message = "Login failed. Please try again.";

        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data;
          if (errorData) {
            // Check for account lock error
            if (
              errorData.error ===
              "Your account has been locked due to multiple failed login attempts"
            ) {
              setAccountLocked(true);
              message = errorData.error;
            } else if (typeof errorData === "string") {
              message = errorData;
            } else if ("message" in errorData) {
              message = (errorData as any).message;
            } else if ("error" in errorData) {
              message = (errorData as any).error;
            }
          }
          console.log("error", errorData);
        }
        toast.error(message);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-linear-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800 p-4 min-h-screen">
      {/* <div className="bg-background relative dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md h-120"> */}
      <div
        className={`bg-background relative dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-300 ${
          isFirstTimeLogin
            ? "min-h-[420px]"
            : accountLocked
              ? "min-h-[550px]"
              : "min-h-[480px]"
        }`}
      >
        <div className="text-center mb-8">
          {isFirstTimeLogin ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Account Setup
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your email and temporary password
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your account
              </p>
            </>
          )}
        </div>

        {/* Account Lock Message  */}
        {accountLocked && (
          <div className="mb-2 p-2 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">
                  Account Temporarily Locked
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Your account will be automatically unlocked in 15 minutes for
                  security.
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          className="flex flex-col gap-3 "
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* Email Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="email"
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setErrors({
                      ...errors,
                      email: validateEmail(e.target.value),
                    });
                  }
                }}
                onBlur={() => handleBlur("email")}
                value={email}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.email && errors.email
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {touched.email && errors.email && (
              <div className="flex items-center gap-1  text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="password"
            >
              {isFirstTimeLogin ? "Temporary Password" : "Password"}
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
                }}
                onBlur={() => handleBlur("password")}
                value={password}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.password && errors.password
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                }`}
                placeholder={
                  isFirstTimeLogin
                    ? "Enter your temporary password"
                    : "Enter your password"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="flex items-center gap-1  text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.password}</span>
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
                {isFirstTimeLogin ? "Starting Setup..." : "Logging in..."}
              </span>
            ) : isFirstTimeLogin ? (
              "Begin Account Setup"
            ) : (
              "Sign In"
            )}
          </button>

          {/* Links */}
          {!isFirstTimeLogin && (
            <div className="flex flex-col absolute gap-2 bottom-10 left-1/2 -translate-1/2 w-full max-w-62 text-center ">
              {/* <a
                href="/register"
                className="text-card-foreground/70 hover:text-card-foreground font-medium transition-colors cursor-pointer"
              >
                Don't have an account? Sign up
              </a> */}
              <a
                href="/forgot-password"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors cursor-pointer"
              >
                Forgot your password?
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
