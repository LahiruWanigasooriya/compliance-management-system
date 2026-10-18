"use client";
import { sendMfaCode } from "@/actions/auth.actions";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Mail,
  Smartphone,
  Shield,
  CheckCircle,
  Star,
  Send,
} from "lucide-react";

// Icon mapping for different method types
const methodIcons = {
  email: Mail,
  sms: Smartphone,
  totp: Shield,
  authenticator: Shield,
};

// Color mapping for different method types
const methodColors = {
  email: "from-blue-500 to-blue-600",
  sms: "from-green-500 to-green-600",
  totp: "from-purple-500 to-purple-600",
  authenticator: "from-purple-500 to-purple-600",
};

function SendCodeStep({
  mfaMethods,
  onCodeSent,
}: {
  mfaMethods: any[];
  onCodeSent: () => void;
}) {
  const navigate = useRouter();
  const [isLoading, startTransition] = useTransition();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  const handleSendCode = (methodId?: string) => {
    setSelectedMethodId(methodId || null);

    startTransition(async () => {
      try {
        const mfaSessionToken = Cookies.get("mfa_session_token");
        if (!mfaSessionToken) {
          toast.error("Session expired. Please login again.");
          navigate.push("/login");
          return;
        }
        if (methodId) {
          Cookies.set("mfa_method_id", methodId, { expires: 7 });
        }
        const response = await sendMfaCode(mfaSessionToken, methodId);
        if (response?.success) {
          toast.success(response.message || "Verification code sent!");
          localStorage.setItem("IsDoneMfaVerifyTimer", "false");
          onCodeSent();
        }
      } catch (err: unknown) {
        let message = "Failed to send verification code";

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
      } finally {
        setSelectedMethodId(null);
      }
    });
  };

  const getMethodDisplayName = (type: string): string => {
    const names: { [key: string]: string } = {
      email: "Email",
      sms: "SMS",
      totp: "Authenticator App",
      authenticator: "Authenticator App",
    };
    return names[type] || type;
  };

  const maskIdentifier = (identifier: string, type: string): string => {
    if (type === "email") {
      const [username, domain] = identifier.split("@");
      if (username.length <= 3) return identifier;
      return `${username.slice(0, 2)}***@${domain}`;
    }
    if (type === "sms") {
      if (identifier.length <= 4) return identifier;
      return `***${identifier.slice(-4)}`;
    }
    return identifier;
  };

  if (mfaMethods.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 w-full  mx-auto p-6">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 w-full">
          <p className="text-red-200 text-sm text-center">
            No authentication methods configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Verify Your Identity
        </h2>
        <p className="text-blue-100 text-sm">
          Choose where to receive your verification code
        </p>
      </div>

      {/* Method Cards */}
      <div className="flex flex-col gap-3 w-full">
        {mfaMethods.map((method) => {
          const IconComponent =
            methodIcons[method.type as keyof typeof methodIcons] || Shield;
          const colorClass =
            methodColors[method.type as keyof typeof methodColors] ||
            "from-gray-500 to-gray-600";
          const isCurrentlyLoading =
            isLoading && selectedMethodId === method.id;
          const isOtherLoading = isLoading && selectedMethodId !== method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSendCode(method.id)}
              disabled={isLoading}
              className="group relative bg-white rounded-xl p-5 text-left transition-all transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`bg-gradient-to-br ${colorClass} rounded-lg p-3 flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow ${
                    isCurrentlyLoading ? "animate-pulse" : ""
                  }`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-900 font-bold text-base">
                      {getMethodDisplayName(method.type)}
                    </h3>
                    {method.is_primary && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-medium">Primary</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm">
                    {maskIdentifier(method.identifier, method.type)}
                  </p>

                  {method.last_used && (
                    <p className="text-gray-400 text-xs mt-1">
                      Last used:{" "}
                      {new Date(method.last_used).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Loading or Arrow */}
                <div className="flex-shrink-0 self-center">
                  {isCurrentlyLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-blue-600"
                      viewBox="0 0 24 24"
                    >
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
                  ) : (
                    <Send
                      className={`w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ${
                        isOtherLoading ? "opacity-30" : ""
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State Message */}
      {isLoading && (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 w-full animate-pulse">
          <p className="text-blue-100 text-sm text-center">
            Sending verification code...
          </p>
        </div>
      )}

      {/* Info Box */}
      {!isLoading && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 w-full">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium mb-1">
                What happens next?
              </p>
              <p className="text-blue-100 text-xs">
                You'll receive a verification code that you'll need to enter on
                the next screen. The code is valid for a limited time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-blue-200 text-xs">
          Don't have access to any of these? Contact support for assistance.
        </p>
      </div>
    </div>
  );
}

export default SendCodeStep;
