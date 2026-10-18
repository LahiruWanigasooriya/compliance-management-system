import { getMfaSetupMethods } from "@/actions/auth.actions";
import React, { useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import {
  Mail,
  Smartphone,
  Shield,
  CheckCircle,
  ArrowRight,
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

function ChooseMfaMethodStep({
  onMethodSelected,
}: {
  onMethodSelected: (methodType: string) => void;
}) {
  const [methods, setMethods] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await getMfaSetupMethods();
        if (response?.methods) {
          setMethods(response.methods);
        }
      } catch (err) {
        let message = "Failed to load MFA methods";
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
        setIsLoading(false);
      }
    };
    fetchMethods();
  }, []);

  const handleMethodClick = (methodType: string) => {
    setSelectedMethod(methodType);
    // Add a slight delay for visual feedback
    setTimeout(() => {
      onMethodSelected(methodType);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        <p className="text-white text-sm">Loading authentication methods...</p>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-6">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 w-full">
          <p className="text-red-200 text-sm text-center">
            No authentication methods available. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full  mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Authentication Method
        </h2>
        <p className="text-blue-100 text-sm">
          Select how you'd like to verify your identity
        </p>
      </div>

      {/* Method Cards */}
      <div className="grid gap-3 w-full">
        {methods.map((method) => {
          const IconComponent =
            methodIcons[method.type as keyof typeof methodIcons] || Shield;
          const colorClass =
            methodColors[method.type as keyof typeof methodColors] ||
            "from-gray-500 to-gray-600";
          const isSelected = selectedMethod === method.type;

          return (
            <button
              key={method.type}
              type="button"
              onClick={() => handleMethodClick(method.type)}
              disabled={isSelected}
              className={`group h-[125px] relative bg-white rounded-xl p-5 text-left transition-all transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30 disabled:scale-100 cursor-pointer  ${
                isSelected ? "ring-4 ring-green-400" : ""
              }`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`bg-gradient-to-br ${colorClass} rounded-lg p-3 flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow`}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-bold text-base mb-1 flex items-center gap-2">
                    {method.name}
                    {method.recommended && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {method.description}
                  </p>

                  {/* Features/Benefits */}
                  {method.features && method.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {method.features.map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Estimated Time */}
                  {method.setup_time && (
                    <p className="text-gray-500 text-xs">
                      Setup time: ~{method.setup_time}
                    </p>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 self-center">
                  <ArrowRight
                    className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all ${
                      isSelected ? "opacity-0" : ""
                    }`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 w-full">
        <p className="text-blue-100 text-xs text-center">
          You can add additional methods later in your security settings
        </p>
      </div>
    </div>
  );
}

export default ChooseMfaMethodStep;
