"use client";
import { registerUser } from "@/actions/auth.actions";
import { getRoles } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import React, { useTransition, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { Role } from "@/types/user.types";

interface ValidationErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  roleId?: string;
}

export function formatRoleName(role: string): string {
  if (!role || role === "N/A") return role;
  
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function Register() {
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouched] = React.useState({
    email: false,
    fullName: false,
    phone: false,
    roleId: false,
  });

  const navigate = useRouter();
  const [isRegistering, startTransition] = useTransition();

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const response = await getRoles();
        
        if (response.success && response.data?.roles) {
          setRoles(response.data.roles);
        } else {
          toast.error("Failed to load roles");
        }
      } catch (error) {
        console.error("Error loading roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validateFullName = (name: string): string | undefined => {
    if (!name) return "Full name is required";
    if (name.trim().length < 2)
      return "Full name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Full name should only contain letters and spaces";
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, "")))
      return "Please enter a valid phone number";
    return undefined;
  };

  const validateRoleId = (roleId: string): string | undefined => {
    if (!roleId) return "Role is required";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateEmail(email),
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      roleId: validateRoleId(roleId),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched({ ...touched, [field]: true });
    const validators = {
      email: validateEmail,
      fullName: validateFullName,
      phone: validatePhone,
      roleId: validateRoleId,
    };
    const value = { email, fullName, phone, roleId }[field];
    setErrors({ ...errors, [field]: validators[field](value) });
  };

  const handleRegister = () => {
    setTouched({
      email: true,
      fullName: true,
      phone: true,
      roleId: true,
    });

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    startTransition(async () => {
      try {
        const response = await registerUser(
          email,
          fullName,
          phone,
          roleId
        );

        if (response?.id) {
          toast.success("Registration successful! Please check your email to set up your password.");
          navigate.push(`/login?from=registration`);
        }
      } catch (err: unknown) {
        let message = "Registration failed. Please try again.";

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
        console.log("Registration error:", message);
        toast.error(message);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-linear-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800 p-4 min-h-screen">
      <div className="bg-background dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Join us today</p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          {/* Full Name */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="fullName"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                id="fullName"
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (touched.fullName)
                    setErrors({
                      ...errors,
                      fullName: validateFullName(e.target.value),
                    });
                }}
                onBlur={() => handleBlur("fullName")}
                value={fullName}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.fullName && errors.fullName
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                }`}
                placeholder="John Doe"
              />
            </div>
            {touched.fullName && errors.fullName && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="email"
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email)
                    setErrors({
                      ...errors,
                      email: validateEmail(e.target.value),
                    });
                }}
                onBlur={() => handleBlur("email")}
                value={email}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.email && errors.email
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {touched.email && errors.email && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="tel"
                id="phone"
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (touched.phone)
                    setErrors({
                      ...errors,
                      phone: validatePhone(e.target.value),
                    });
                }}
                onBlur={() => handleBlur("phone")}
                value={phone}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  touched.phone && errors.phone
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                }`}
                placeholder="+1234567890"
              />
            </div>
            {touched.phone && errors.phone && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Role Dropdown */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="roleId"
            >
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none z-10" />
              <select
                id="roleId"
                onChange={(e) => {
                  setRoleId(e.target.value);
                  if (touched.roleId)
                    setErrors({
                      ...errors,
                      roleId: validateRoleId(e.target.value),
                    });
                }}
                onBlur={() => handleBlur("roleId")}
                value={roleId}
                disabled={isLoadingRoles}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-white appearance-none cursor-pointer ${
                  touched.roleId && errors.roleId
                    ? "border-red-500 focus:ring-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                } ${isLoadingRoles ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="">
                  {isLoadingRoles ? "Loading roles..." : "Select a role"}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {formatRoleName(role.roleName)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
            </div>
            {touched.roleId && errors.roleId && (
              <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.roleId}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isRegistering || isLoadingRoles}
            className="bg-primary dark:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isRegistering ? (
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
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Link */}
          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-card-foreground/70 hover:text-card-foreground font-medium transition-colors"
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}