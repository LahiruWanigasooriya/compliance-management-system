import { completeMfaSetup } from "@/actions/auth.actions";
import React, { useTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { CheckCircle, Copy, Download, AlertTriangle } from "lucide-react";

function CompleteSetupStep({
  backupCodes,
  onVerifySuccess,
}: {
  backupCodes: string[];
  onVerifySuccess: () => void;
}) {
  const [isLoading, startTransition] = useTransition();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const navigate = useRouter();

  const handleComplete = () => {
    startTransition(async () => {
      try {
        const sessionToken = Cookies.get("session_token");
        if (!sessionToken) {
          toast.error("Session expired. Please start over.");
          return;
        }

        const response = await completeMfaSetup(sessionToken);
        if (response?.success) {
          Cookies.remove("session_token");
          Cookies.remove("method_id");
          Cookies.remove("backup_codes");
          Cookies.remove("email");
          toast.success("MFA setup complete!");
        }
      } catch (err: unknown) {
        let message = "Failed to complete MFA setup";
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

  useEffect(() => {
    handleComplete();
  }, []);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCodes = () => {
    const allCodesText = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodesText);
    setAllCopied(true);
    toast.success("All backup codes copied!");
    setTimeout(() => setAllCopied(false), 2000);
  };

  const downloadCodes = () => {
    const content = `MFA Backup Codes - Save these securely!\n\n${backupCodes.join(
      "\n"
    )}\n\nGenerated on: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mfa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded!");
  };

  return (
    <div className="flex flex-col items-center  w-full max-w-md mx-auto  gap-2 ">
      <div className="text-center gap-1 flex flex-col">
        <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto ">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-white ">Setup Complete!</h2>
        <p className="text-blue-100 text-sm">
          Your two-factor authentication is now active
        </p>
      </div>

      <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl  w-full p-2 text-center">
        <div className="flex items-start gap-3">
          <div>
            <p className="text-yellow-100 font-semibold text-sm flex flex-row gap-2 text-center items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
              Important: Save Your Backup Codes
            </p>
            <p className="text-yellow-200 text-xs">
              These codes can be used to access your account if you lose your
              authentication method. Store them securely!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl  w-full shadow-lg p-4">
        <div className="flex items-center justify-between p-2">
          <h3 className="text-gray-800 font-bold text-lg">Backup Codes</h3>
          <div className="flex gap-2">
            <button
              onClick={copyAllCodes}
              className="flex items-center gap-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              {allCopied ? "Copied!" : "Copy All"}
            </button>
            <button
              onClick={downloadCodes}
              className="flex items-center gap-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
            >
              <span className="font-mono text-sm text-gray-700 font-medium">
                {code}
              </span>
              <button
                onClick={() => copyCode(code, index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-blue-100 rounded-md cursor-pointer"
                title="Copy code"
              >
                {copiedIndex === index ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 cursor-pointer" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className=" bg-green-50 rounded-lg p-2 mt-2">
          <p className="text-xs text-gray-600 text-center">
            Each code can only be used once
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          onVerifySuccess();
          navigate.push("/login");
        }}
        className="w-full bg-white text-primary hover:text-secondary  rounded-xl font-semibold hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg p-3 cursor-pointer"
      >
        Continue to Login
      </button>

      <p className="text-blue-100 text-xs text-center">
        You'll need your authentication method or a backup code to sign in
      </p>
    </div>
  );
}

export default CompleteSetupStep;
