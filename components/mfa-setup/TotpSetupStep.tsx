"use client";

import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Cookies from "js-cookie";
import { setupMfaTotp } from "@/actions/auth.actions";
import { toast } from "sonner";

type TotpResponse = {
  method_id: string;
  qr_code_url: string;
  secret: string;
  message: string;
};

const TotpSetup = ({ onNext }: { onNext: () => void }) => {
  const [data, setData] = useState<TotpResponse | null>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initTotp = async () => {
      try {
        const sessionToken = Cookies.get("session_token");

        if (!sessionToken) {
          setError("Session expired. Please login again.");
          return;
        }

        const response = await setupMfaTotp(sessionToken);

        setData(response);
      } catch (err) {
        setError("Failed to setup authenticator app.");
      } finally {
        setLoading(false);
      }
    };

    initTotp();
  }, []);

  useEffect(() => {
    if (data?.method_id)
      Cookies.set("method_id", data?.method_id, {
        expires: 0.5,
      });
  }, [data]);

  if (loading) return <p>Loading QR code...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="  bg-white rounded-lg shadow-lg max-w-sm ">
      <div className="flex flex-col p-3 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Set up Authenticator App
        </h2>
        <p className="text-sm text-gray-600  text-center">
          Scan the QR code with your authenticator app
        </p>

        <div className="flex justify-center   bg-gray-50 rounded-lg">
          {data?.qr_code_url && (
            <QRCodeCanvas
              value={data.qr_code_url}
              size={256}
              level="M"
              className="border-4 border-white shadow-md"
            />
          )}
        </div>

        {data?.message && (
          <div className=" bg-green-50 border border-green-200 rounded text-sm text-green-800 p-2">
            {data.message}
          </div>
        )}

        <div className=" bg-gray-50 rounded-lg border border-gray-200 p-2 flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700 ">
            Can't scan? Enter manually:
          </p>
          <div className="flex items-center justify-between bg-white  rounded border border-gray-300 p-2">
            <code className="text-sm font-mono text-gray-800 break-all">
              {data?.secret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(data?.secret || "");
                toast.success("Code copied to clipboard!");
              }}
              className=" text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors p-2 cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            if (data?.method_id) {
              onNext();
            }
          }}
          className="w-full  bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium shadow-sm p-2 cursor-pointer"
        >
          Continue to Verification
        </button>
      </div>
    </div>
  );
};

export default TotpSetup;
