"use client";
import { useSearchParams } from "next/navigation";
import React, {Suspense} from "react";
import { toast } from "sonner";

import SendCodeStep from "@/components/mfa-verify/SendCodeStep";
import VerifyLoginStep from "@/components/mfa-verify/VerifyLoginStep";

const MFA_STEP_KEY = "mfa_verify_current_step";

function MfaVerifyContent() {
  const searchParams = useSearchParams();
  const mfaMethodsParam = searchParams.get("mfa_methods");
  const [step, setStep] = React.useState(1);
  const [mfaMethods, setMfaMethods] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Load step from localStorage on mount
  React.useEffect(() => {
    const savedStep = localStorage.getItem(MFA_STEP_KEY);
    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
  }, []);

  // Save step to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem(MFA_STEP_KEY, step.toString());
  }, [step]);

  React.useEffect(() => {
    if (mfaMethodsParam) {
      try {
        const methods = JSON.parse(decodeURIComponent(mfaMethodsParam));
        if (Array.isArray(methods) && methods.length > 0) {
          setMfaMethods(methods);
          setHasError(false);
        } else {
          setHasError(true);
          toast.error("No MFA methods available");
        }
      } catch (err) {
        setHasError(true);
        toast.error("Invalid MFA methods data");
      } finally {
        setIsLoading(false);
      }
    } else {
      setHasError(true);
      setIsLoading(false);
      toast.error("Missing MFA methods parameter");
    }
  }, [mfaMethodsParam]);

  const handleVerifySuccess = () => {
    // Remove step from localStorage when verification is successful
    localStorage.removeItem(MFA_STEP_KEY);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (hasError || !mfaMethodsParam || mfaMethods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
        <p className="text-white mb-4">Invalid MFA methods</p>
        <a href="/login" className="text-white underline">
          Return to Login
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
      <div className="">
        {step === 1 && (
          <SendCodeStep mfaMethods={mfaMethods} onCodeSent={() => setStep(2)} />
        )}
        {step === 2 && <VerifyLoginStep onVerifySuccess={handleVerifySuccess} />}
      </div>
    </div>
  );
}

export default function MfaVerify() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <MfaVerifyContent />
    </Suspense>
  );
}