"use client";
import { initiateMfaSetup } from "@/actions/auth.actions";
import { useTransition } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Shield,
  Lock,
  Smartphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

function InitiateMfaSetupStep({
  mfaSetupToken,
  onNext,
}: {
  mfaSetupToken: string;
  onNext: () => void;
}) {
  const [isLoading, startTransition] = useTransition();

  const handleInitiate = () => {
    startTransition(async () => {
      try {
        const response = await initiateMfaSetup(mfaSetupToken);
        if (response?.session_token) {
          Cookies.set("session_token", response.session_token, {
            expires: 0.5,
          });
          toast.success("Let's secure your account!");
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
    <div className="flex flex-col items-center  w-full gap-4">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Secure Your Account
        </h2>
        <p className="text-blue-100 text-base">
          Set up two-factor authentication for enhanced security
        </p>
      </div>

      {/* Benefits Cards */}
      <div className="w-full space-y-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 h-[90px]">
          <div className="flex items-start gap-3">
            <div className="bg-green-500 rounded-lg p-2 flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                Extra Layer of Security
              </h3>
              <p className="text-blue-100 text-xs">
                Protect your account even if your password is compromised
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 h-[90px]">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                Multiple Methods
              </h3>
              <p className="text-blue-100 text-xs">
                Choose from email, SMS, or authenticator app verification
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 h-[90px]">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500 rounded-lg p-2 flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                Backup Codes
              </h3>
              <p className="text-blue-100 text-xs">
                Get recovery codes in case you lose access to your device
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 border-2 border-blue-400/30 rounded-xl p-4 w-full h-[90px]">
        <p className="text-blue-100 text-sm text-center">
          <span className="font-semibold">Setup takes about 2 minutes</span>
          <br />
          You'll choose your preferred authentication method next
        </p>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={handleInitiate}
        className="w-full bg-white text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
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
            Initializing...
          </>
        ) : (
          <>
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-blue-200 text-xs text-center">
        Your security is our top priority
      </p>
    </div>
  );
}

export default InitiateMfaSetupStep;
