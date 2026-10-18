"use client";
import React, { Suspense } from "react";

import ForgetPasswordStep from "@/components/forgot-password/ForgetPasswordStep";
import VerifyOtpStep from "@/components/forgot-password/VerifyOtpStep";
import ResetPasswordStep from "@/components/forgot-password/ResetPasswordStep";

const Forgot_Password_Step_Key = "forgot_password_current_step";

function ForgotPasswordContent() {
  const [step, setStep] = React.useState("1");

  React.useEffect(() => {
    const savedStep = localStorage.getItem(Forgot_Password_Step_Key);
    if (savedStep) {
      setStep(savedStep);
    }
  }, []);

  // Save step to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem(Forgot_Password_Step_Key, step.toString());
  }, [step]);

  const handleVerifySuccess = () => {
    // Remove step from localStorage when verification is successful
    localStorage.removeItem(Forgot_Password_Step_Key);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800 p-4 min-h-screen">
      {step === "1" && <ForgetPasswordStep onNext={() => setStep("2")} />}
      {step === "2" && <VerifyOtpStep onNext={() => setStep("3")} />}
      {step === "3" && (
        <ResetPasswordStep onVerifySuccess={handleVerifySuccess} />
      )}
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center bg-primary p-4 rounded-lg h-screen">
          <p className="text-white">Loading...</p>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
