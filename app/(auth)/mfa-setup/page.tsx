"use client";
import {  useSearchParams } from "next/navigation";
import React, {  useEffect, Suspense  } from "react";
import { toast } from "sonner";

import InitiateMfaSetupStep from "@/components/mfa-setup/InitiateMfaSetupStep";
import ChooseMfaMethodStep from "@/components/mfa-setup/ChooseMfaMethodStep";
import EmailSetupStep from "@/components/mfa-setup/EmailSetupStep";
import TotpSetupStep from "@/components/mfa-setup/TotpSetupStep";
import VerifyCodeStep from "@/components/mfa-setup/VerifyCodeStep";
import CompleteSetupStep from "@/components/mfa-setup/CompleteSetupStep";

const MFA_STEP_KEY = "mfa_setup_current_step";


 function MfaSetupContent() {
  const searchParams = useSearchParams();
  const mfaSetupToken = searchParams.get("mfa_setup_token");
  const [step, setStep] = React.useState("1");
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(
    null
  );
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  // Load step from localStorage on mount

  React.useEffect(() => {
      const savedStep = localStorage.getItem(MFA_STEP_KEY);
      if (savedStep) {
        setStep(savedStep);
      }
    }, []);
  
    // Save step to localStorage whenever it changes
    React.useEffect(() => {
      localStorage.setItem(MFA_STEP_KEY, step.toString());
    }, [step]);

  useEffect(() => {
    if (!mfaSetupToken) {
      toast.error("Invalid setup token");
      // Redirect to register or login
    }
  }, [mfaSetupToken]);

  const handleVerifySuccess = () => {
    // Remove step from localStorage when verification is successful
    localStorage.removeItem(MFA_STEP_KEY);
  };

  if (!mfaSetupToken) {
    return (
      <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
        <p className="text-white">Invalid setup token</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg min-h-screen  w-full">
      <div className="">
        {step === "1" && (
          <InitiateMfaSetupStep
            mfaSetupToken={mfaSetupToken}
            onNext={() => setStep("2")}
          />
        )}
        {step === "2" && (
          <ChooseMfaMethodStep
            onMethodSelected={(methodType) => {
              setSelectedMethod(methodType);
              if (methodType === "email") {
                setStep("3a");
              }
              if (methodType === "totp") {
                setStep("3c");
              }
              // Add SMS and TOTP later
            }}
          />
        )}
        {step === "3a" && (
          <EmailSetupStep
            onNext={() => setStep("4")}
          />
        )}
        {step === "3c" && (
          <TotpSetupStep
            onNext={() => setStep("4")}
          />
        )}
        {step === "4" && (
          <VerifyCodeStep
            onNext={(codes) => {
              setBackupCodes(codes);
              setStep("5");
            }}
            methodType={selectedMethod!}
          />
        )}
        {step === "5" && <CompleteSetupStep backupCodes={backupCodes} onVerifySuccess={handleVerifySuccess}/>}
      </div>
    </div>
  );
}

export default function MfaSetup() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <MfaSetupContent />
    </Suspense>
  );
}

