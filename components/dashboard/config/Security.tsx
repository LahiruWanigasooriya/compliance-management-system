"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Lock, Clock, Shield, Smartphone, Activity } from "lucide-react";
import LoginActivityComponent from "./LoginActivity";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import {
  getTenantSettings,
  updateTenantSettings,
} from "@/actions/config.actions";
import RBACDashboard from "@/components/rbac/RBACDashboard";

const Security = () => {
  const [activeTab, setActiveTab] = useState("sessionTimeout");
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [minPasswordLength, setMinPasswordLength] = useState("12");
  const [passwordPolicies, setPasswordPolicies] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    specialChars: true,
  });
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordExpiration, setPasswordExpiration] = useState("90");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    // {
    //   id: "sessionTimeout",
    //   label: "Session Timeout",
    //   icon: Clock,
    // },
    // {
    //   id: "passwordPolicy",
    //   label: "Password Policy",
    //   icon: Shield,
    // },
    // {
    //   id: "mfa",
    //   label: "Multi-Factor Auth",
    //   icon: Smartphone,
    // },
    {
      id: "loginActivity",
      label: "Login Activity",
      icon: Activity,
    },
    {
      id: "rbac",
      label: "Role-Based Access Control",
      icon: Activity,
    },
  ];

  // Load tenant settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getTenantSettings();

        // Set session timeout
        if (data.session_timeout) {
          setSessionTimeout(data.session_timeout.toString());
        }

        // Set password policies
        if (data.password_min_length) {
          setMinPasswordLength(data.password_min_length.toString());
        }
        if (data.password_expiry_days) {
          setPasswordExpiration(data.password_expiry_days.toString());
        }

        setPasswordPolicies({
          uppercase: data.password_require_upper ?? true,
          lowercase: data.password_require_lower ?? true,
          numbers: data.password_require_number ?? true,
          specialChars: data.password_require_special ?? true,
        });

        // Set MFA
        if (data.enable_mfa !== undefined) {
          setMfaEnabled(data.enable_mfa);
        }
      } catch (error) {
        console.error("Failed to load tenant settings:", error);
        setToastMessage("Failed to load settings");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSessionTimeoutSave = async () => {
    try {
      setIsLoading(true);
      await updateTenantSettings({
        session_timeout: parseInt(sessionTimeout),
      });
      setToastMessage("Session time-out has been updated");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to update session timeout:", error);
      setToastMessage("Failed to update session timeout");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordPolicySave = async () => {
    try {
      setIsLoading(true);
      await updateTenantSettings({
        password_min_length: parseInt(minPasswordLength),
        password_require_upper: passwordPolicies.uppercase,
        password_require_lower: passwordPolicies.lowercase,
        password_require_number: passwordPolicies.numbers,
        password_require_special: passwordPolicies.specialChars,
        password_expiry_days: parseInt(passwordExpiration),
      });
      setToastMessage("Password policies have been updated");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to update password policies:", error);
      setToastMessage("Failed to update password policies");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  type PasswordPolicyKey =
    | "uppercase"
    | "lowercase"
    | "numbers"
    | "specialChars";

  const handlePolicyToggle = (policy: PasswordPolicyKey) => {
    setPasswordPolicies((prev) => ({ ...prev, [policy]: !prev[policy] }));
  };

  const handleMfaToggle = async () => {
    try {
      setIsLoading(true);
      const newValue = !mfaEnabled;
      await updateTenantSettings({
        enable_mfa: newValue,
      });
      setMfaEnabled(newValue);
      setToastMessage(
        newValue
          ? "MFA has been enforced successfully"
          : "MFA has been disabled successfully",
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to update MFA setting:", error);
      setToastMessage("Failed to update MFA setting");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-0 md:py-6 font-sans">
      <div className=" mx-auto">
        <div className="grid grid-cols-1 w-full gap-y-2 xl:flex xl:flex-col-2 xl:gap-6">
          {/* Sidebar Navigation */}
          <nav className="space-y-1 flex items-center justify-center xl:justify-start  flex-col gap-1 xl:flex-col ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id) return;
                  startTransition(() => setActiveTab(tab.id));
                }}
                className={`w-full xl:w-50 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-secondary text-white justify-center xl:justify-start shadow-md"
                    : " text-gray-600 hover:bg-gray-100 bg-card flex justify-center xl:justify-start dark:text-gray-300 dark:hover:bg-card/80"
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3 " />
                <h1 className="text-left"> {tab.label}</h1>
              </button>
            ))}
          </nav>

          {/* Main Content Area */}
          <main className="lg:col-span-3 w-full relative">
            {isPending && (
              <LoadingOverlay
                className="-inset-4"
                loadingText="Switching tabs..."
              />
            )}

            {/* Session Timeout Settings */}
            {activeTab === "sessionTimeout" && (
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Clock
                        size={20}
                        className="dark:text-white text-white"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Session Timeout Settings
                      </h2>
                      <p className="text-xs text-prime-foreground">
                        Manage user session timeouts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-card border-b border-border rounded-xl">
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-prime-foreground mb-3">
                      Session Timeout Duration
                    </label>
                    <div className="flex items-center space-x-3">
                      <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="flex-1 px-3 py-2.5 border bg-card border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="240">4 Hours</option>
                      </select>
                      <button
                        onClick={handleSessionTimeoutSave}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                    <p className="text-xs text-prime-foreground mt-3">
                      Current setting:{" "}
                      <span className="font-semibold">
                        {sessionTimeout} minutes
                      </span>{" "}
                      - Applied to all system users
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Password Policy Section */}
            {activeTab === "passwordPolicy" && (
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Shield size={20} className="text-purple-900" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Password Policy
                      </h2>
                      <p className="text-xs text-prime-foreground">
                        Configure password complexity rules
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-card">
                  <div className="space-y-6">
                    {/* Password Length & Expiration */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Password Minimum Length
                        </h3>
                        <div className="max-w-md flex items-center space-x-3">
                          <input
                            type="number"
                            min="8"
                            max="32"
                            value={minPasswordLength}
                            onChange={(e) =>
                              setMinPasswordLength(e.target.value)
                            }
                            className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
                          />
                          <span className="text-sm text-prime-foreground">
                            characters
                          </span>
                        </div>
                        <p className="text-xs text-prime-foreground mt-2">
                          Current:{" "}
                          <span className="font-semibold">
                            {minPasswordLength} characters minimum
                          </span>
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Password Expiration
                        </h3>
                        <div className="max-w-md flex items-center space-x-3">
                          <select
                            value={passwordExpiration}
                            onChange={(e) =>
                              setPasswordExpiration(e.target.value)
                            }
                            className="w-48 px-3 py-2.5 border bg-card border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5276] text-sm"
                          >
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                            <option value="180">180 days</option>
                            <option value="365">365 days</option>
                          </select>
                          <span className="text-sm text-prime-foreground">
                            Users must update passwords after this period
                          </span>
                        </div>
                        <p className="text-xs text-prime-foreground mt-2">
                          Current:{" "}
                          <span className="font-semibold">
                            {passwordExpiration} day cycle
                          </span>{" "}
                          - users get prompted on expiry
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Password Complexity Rules
                      </h3>
                      <div className="space-y-4">
                        {/* Uppercase */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-prime-foreground">
                              Require Uppercase Letters
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Enforce at least one uppercase character (A-Z)
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolicyToggle("uppercase");
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:ring-offset-2 ${
                              passwordPolicies.uppercase
                                ? "bg-[#1A5276]"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                passwordPolicies.uppercase
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Lowercase */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-prime-foreground">
                              Require Lowercase Letters
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Enforce at least one lowercase character (a-z)
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolicyToggle("lowercase");
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:ring-offset-2 ${
                              passwordPolicies.lowercase
                                ? "bg-[#1A5276]"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                passwordPolicies.lowercase
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Numbers */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-prime-foreground">
                              Require Numbers
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Enforce at least one numeric character (0-9)
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolicyToggle("numbers");
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:ring-offset-2 ${
                              passwordPolicies.numbers
                                ? "bg-[#1A5276]"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                passwordPolicies.numbers
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Special Characters */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-prime-foreground">
                              Require Special Characters
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Enforce at least one special character (!@#$%^&*)
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolicyToggle("specialChars");
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:ring-offset-2 ${
                              passwordPolicies.specialChars
                                ? "bg-[#1A5276]"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                passwordPolicies.specialChars
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-border">
                      <button
                        onClick={handlePasswordPolicySave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Saving..." : "Save Password Policies"}
                      </button>
                    </div>

                    {/* Policy Summary */}
                    <div className="bg-card border border-blue-500 rounded-lg p-4">
                      <p className="text-xs font-semibold dark:text-blue-300 text-blue-900 mb-2">
                        Current Password Policy Summary
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                        <li>
                          • Minimum length: {minPasswordLength} characters
                        </li>
                        <li>
                          • Uppercase required:{" "}
                          {passwordPolicies.uppercase ? "Yes" : "No"}
                        </li>
                        <li>
                          • Lowercase required:{" "}
                          {passwordPolicies.lowercase ? "Yes" : "No"}
                        </li>
                        <li>
                          • Numbers required:{" "}
                          {passwordPolicies.numbers ? "Yes" : "No"}
                        </li>
                        <li>
                          • Special characters required:{" "}
                          {passwordPolicies.specialChars ? "Yes" : "No"}
                        </li>
                        <li>
                          • Expiration: every {passwordExpiration} days; prompt
                          on next login after expiry
                        </li>
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2 italic">
                        All new passwords will comply with the configured policy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Factor Authentication Section */}
            {activeTab === "mfa" && (
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Smartphone
                        size={20}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Multi-Factor Authentication
                      </h2>
                      <p className="text-xs text-prime-foreground">
                        Enforce MFA for enhanced security
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-card">
                  <div className="space-y-6">
                    {/* MFA Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          Require MFA for All Users
                        </h3>
                        <p className="text-xs text-prime-foreground">
                          When enabled, all users must set up multi-factor
                          authentication during their next login
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMfaToggle();
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:ring-offset-2 ${
                          mfaEnabled ? "bg-[#1A5276]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            mfaEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* MFA Status */}
                    <div
                      className={`border rounded-lg p-4 ${
                        mfaEnabled
                          ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold mb-2 ${
                          mfaEnabled
                            ? "text-green-900 dark:text-green-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Current MFA Status
                      </p>
                      <p
                        className={`text-xs ${
                          mfaEnabled
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {mfaEnabled
                          ? "✓ MFA is currently enforced for all users. Users will be prompted to set up MFA during their next login."
                          : "✗ MFA is not required. Users can optionally enable MFA in their account settings."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Login Activity Section */}
            {activeTab === "loginActivity" && <LoginActivityComponent />}

            {/* Role-Based Access Control*/}
            {activeTab === "rbac" && <RBACDashboard />}
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-card-second border border-border rounded-lg p-4 flex items-start space-x-3 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
          <div>
            <p className="text-sm font-semibold text-green-900">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
