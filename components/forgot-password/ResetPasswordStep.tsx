"use client";
import React, { useTransition, useState } from "react";
import { Shield, Lock, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth.actions";

// ValidationItem component moved OUTSIDE to fix ESLint error
const ValidationItem = ({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) => (
  <div className="flex items-center gap-2 text-sm">
    {isValid ? (
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
    ) : (
      <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
    )}
    <span className={isValid ? "text-green-600" : "text-gray-500"}>{text}</span>
  </div>
);

function ResetPasswordStep({
  onVerifySuccess,
}: {
  onVerifySuccess: () => void;
}) {
  const [isLoading, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const navigate = useRouter();

  // Password validation
  const passwordValidations = {
    minLength: newPassword.length >= 12,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword !== "";
  const canSubmit = isPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Please fix all validation errors before submitting.");
      setTouched({ newPassword: true, confirmPassword: true });
      return;
    }

    startTransition(async () => {
      try {
        const email = Cookies.get("reset_password_email");
        const reset_token = Cookies.get("reset_token");

        if (!email || !reset_token) {
          toast.error(
            "Session expired. Please restart the password reset process."
          );
          return;
        }

        const response = await resetPassword(
          email,
          reset_token,
          newPassword,
          confirmPassword
        );

        if (response?.success === true) {
          toast.success(
            response.message || "Password has been reset successfully!"
          );
          onVerifySuccess();
          Cookies.remove("reset_password_email");
          Cookies.remove("reset_token");
          navigate.push("/login");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password");
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      handleSubmit();
    }
  };

  return (
    <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white  mb-2">
          Reset Your Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a strong, secure password for your account
        </p>
      </div>

      <form className="flex flex-col mt-13 gap-10">
        {/* New Password Field */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="new-password"
          >
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type={showNewPassword ? "text" : "password"}
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, newPassword: true })}
              onKeyPress={handleKeyPress}
              placeholder="Enter new password"
              className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 transition-all text-gray-800 dark:text-white bg-white dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          {touched.newPassword && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password must contain:
              </p>
              <ValidationItem
                isValid={passwordValidations.minLength}
                text="At least 12 characters"
              />
              <ValidationItem
                isValid={passwordValidations.hasUpperCase}
                text="One uppercase letter (A-Z)"
              />
              <ValidationItem
                isValid={passwordValidations.hasLowerCase}
                text="One lowercase letter (a-z)"
              />
              <ValidationItem
                isValid={passwordValidations.hasNumber}
                text="One number (0-9)"
              />
              <ValidationItem
                isValid={passwordValidations.hasSpecialChar}
                text="One special character (!@#$%...)"
              />
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="confirm-password"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              onKeyPress={handleKeyPress}
              placeholder="Confirm new password"
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-800 dark:text-white bg-white dark:bg-gray-700 ${
                touched.confirmPassword && confirmPassword
                  ? passwordsMatch
                    ? "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                    : "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Match Indicator */}
          {touched.confirmPassword && confirmPassword && (
            <div className="flex items-center gap-1 text-sm mt-2">
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">
                    Passwords match!
                  </span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">
                    Passwords don't match
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 transition-all mt-2 ${
            canSubmit
              ? "bg-primary dark:bg-blue-600 text-white hover:bg-secondary dark:hover:bg-blue-700 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 cursor-pointer"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
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
              Resetting Password...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 text-sm mt-6">
        <Shield className="w-5 h-5 text-primary dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-800 dark:text-white">
            Security tip:
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Use a unique password you haven't used elsewhere. Consider using a
            password manager to generate and store secure passwords.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordStep;
