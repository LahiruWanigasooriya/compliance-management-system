"use client";
import { useEffect, useState } from "react";
import { FileCheck, Loader2 } from "lucide-react";
import { getKYCPreferences, updateKYCPreferences } from "@/actions/kyc.actions";
import { KYCPreferences as KYCPreferencesType } from "@/types/kyc/kyc.types";
import { ICONS } from "@/constants/constants";
import { toast } from "sonner";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

interface SettingCardProps {
  icon: typeof FileCheck;
  iconColor: "blue" | "green" | "purple" | "red" | "orange" | "yellow";
  title: string;
  description: string;
  children: React.ReactNode;
}

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  yellow: "bg-yellow-100 text-yellow-600",
};

const SettingCard = ({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: SettingCardProps) => (
  <div className="border rounded-xl p-5 border-border bg-card hover:border-blue-300 transition-all duration-200">
    <div className="flex gap-4">
      <div
        className={`${colorMap[iconColor]} rounded-lg p-3 h-fit hidden md:block`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className="text-foreground font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        {children}
      </div>
    </div>
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

const Toggle = ({ checked, onChange, label, description }: ToggleProps) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <label className="text-sm font-medium text-foreground cursor-pointer">
        {label}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } relative`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  description,
}: TextInputProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border placeholder-muted-foreground"
    />
  </div>
);

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
}

const NumberInput = ({
  label,
  value,
  onChange,
  min,
  max,
  description,
}: NumberInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  // Update local state when prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <input
        type="number"
        value={inputValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);

          if (newValue !== "" && newValue !== "-") {
            const parsedValue = parseInt(newValue);
            if (!isNaN(parsedValue)) {
              onChange(parsedValue);
            }
          }
        }}
        onBlur={() => {
          if (inputValue === "" || inputValue === "-") {
            setInputValue("0");
            onChange(0);
          }
        }}
        min={min}
        max={max}
        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border"
      />
    </div>
  );
};

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  description?: string;
}

const TagInput = ({
  label,
  value,
  onChange,
  placeholder,
  description,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type and press Enter to add"}
        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition bg-card text-foreground border-border placeholder-muted-foreground"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((tag) => (
            <div
              key={tag}
              className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => handleRemove(tag)}
                className="text-blue-700 hover:text-blue-900 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const KYCPreferencesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<Partial<KYCPreferencesType>>({
    approve_kyc_reasons: [],
    is_document_verification_required: true,
    is_face_verification_required: true,
    is_address_verification_required: false,
    is_age_verification_required: false,
    min_age: 18,
    max_age: 100,
    required_document_count: 2,
    critical_risk_score: 75,
    high_risk_score: 65,
    medium_risk_score: 50,
    supported_document_types: [],
    callback_url: "",
  });
  const [originalPreferences, setOriginalPreferences] = useState<
    Partial<KYCPreferencesType>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await getKYCPreferences();
        if (response.success && response.data) {
          setPreferences(response.data);
          setOriginalPreferences(response.data);
        } else {
          toast.error(response.message || "Failed to load KYC preferences");
        }
      } catch (err) {
        console.error("Error fetching KYC preferences:", err);
        toast.error("Failed to load KYC preferences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed =
      JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare payload
      const payload: Partial<KYCPreferencesType> = {
        ...preferences,
      };

      const response = await updateKYCPreferences(payload);

      if (response.success) {
        // Refetch the preferences to ensure we have the correct data from the server
        const refetchResponse = await getKYCPreferences();
        if (refetchResponse.success && refetchResponse.data) {
          setPreferences(refetchResponse.data);
          setOriginalPreferences(refetchResponse.data);
        } else {
          // Fallback to the update response if refetch fails
          setOriginalPreferences(response.data);
          setPreferences(response.data);
        }
        toast.success("KYC preferences updated successfully");
      } else {
        toast.error(response.message || "Failed to update KYC preferences");
      }
    } catch (err) {
      console.error("Error saving KYC preferences:", err);
      toast.error("Failed to save KYC preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(originalPreferences);
  };

  const updatePreference = <K extends keyof KYCPreferencesType>(
    key: K,
    value: KYCPreferencesType[K],
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="relative h-40 w-full">
        <LoadingOverlay loadingText="Loading KYC preferences..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Verification Settings */}
      <SettingCard
        icon={FileCheck}
        iconColor="blue"
        title="Document Verification"
        description="Configure document verification requirements for KYC"
      >
        <div className="space-y-4">
          <Toggle
            checked={preferences.is_document_verification_required || false}
            onChange={(value) =>
              updatePreference("is_document_verification_required", value)
            }
            label="Document Verification Required"
            description="Require users to submit documents for verification"
          />

          <Toggle
            checked={preferences.is_face_verification_required || false}
            onChange={(value) =>
              updatePreference("is_face_verification_required", value)
            }
            label="Face Verification Required"
            description="Require users to complete face verification"
          />

          <Toggle
            checked={preferences.is_address_verification_required || false}
            onChange={(value) =>
              updatePreference("is_address_verification_required", value)
            }
            label="Address Verification Required"
            description="Require users to provide address verification"
          />

          <NumberInput
            label="Required Document Count"
            value={preferences.required_document_count || 2}
            onChange={(value) =>
              updatePreference("required_document_count", value)
            }
            min={1}
            max={10}
            description="Minimum number of documents required for KYC"
          />

          <TagInput
            label="Supported Document Types"
            value={preferences.supported_document_types || []}
            onChange={(value) =>
              updatePreference("supported_document_types", value)
            }
            placeholder="e.g., id_card, passport, driving_license"
            description="List of accepted document types"
          />
        </div>
      </SettingCard>

      {/* Age Verification Settings */}
      <SettingCard
        icon={ICONS.Users}
        iconColor="purple"
        title="Age Verification"
        description="Configure age verification requirements"
      >
        <div className="space-y-4">
          <Toggle
            checked={preferences.is_age_verification_required || false}
            onChange={(value) =>
              updatePreference("is_age_verification_required", value)
            }
            label="Age Verification Required"
            description="Enforce age verification during KYC"
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Minimum Age"
              value={preferences.min_age || 18}
              onChange={(value) => updatePreference("min_age", value)}
              min={0}
              max={120}
              description="Minimum required age"
            />

            <NumberInput
              label="Maximum Age"
              value={preferences.max_age || 100}
              onChange={(value) => updatePreference("max_age", value)}
              min={0}
              max={150}
              description="Maximum allowed age"
            />
          </div>
        </div>
      </SettingCard>

      {/* Risk Score Thresholds */}
      <SettingCard
        icon={ICONS.AlertTriangle}
        iconColor="red"
        title="Risk Score Thresholds"
        description="Define risk level thresholds for KYC assessment"
      >
        <div className="space-y-4">
          <NumberInput
            label="Critical Risk Score"
            value={preferences.critical_risk_score || 75}
            onChange={(value) => updatePreference("critical_risk_score", value)}
            min={0}
            max={100}
            description="Score threshold for critical risk level"
          />

          <NumberInput
            label="High Risk Score"
            value={preferences.high_risk_score || 65}
            onChange={(value) => updatePreference("high_risk_score", value)}
            min={0}
            max={100}
            description="Score threshold for high risk level"
          />

          <NumberInput
            label="Medium Risk Score"
            value={preferences.medium_risk_score || 50}
            onChange={(value) => updatePreference("medium_risk_score", value)}
            min={0}
            max={100}
            description="Score threshold for medium risk level"
          />
        </div>
      </SettingCard>

      {/* KYC Approval Reasons */}
      <SettingCard
        icon={ICONS.CheckCircle}
        iconColor="green"
        title="KYC Approval Reasons"
        description="Define reasons for approving KYC applications"
      >
        <TagInput
          label="Approval Reasons"
          value={preferences.approve_kyc_reasons || []}
          onChange={(value) => updatePreference("approve_kyc_reasons", value)}
          placeholder="e.g., identity_verification, compliance_check"
          description="Add custom reasons for KYC approvals"
        />
      </SettingCard>

      {/* Webhook Configuration */}
      <SettingCard
        icon={ICONS.Link}
        iconColor="orange"
        title="Webhook Configuration"
        description="Configure webhook for KYC status updates"
      >
        <TextInput
          label="Callback URL"
          value={preferences.callback_url || ""}
          onChange={(value) => updatePreference("callback_url", value)}
          placeholder="https://api.example.com/webhooks/kyc-status"
          description="Webhook URL to receive KYC status updates"
        />
      </SettingCard>

      {/* Action Buttons */}
      <div className="flex gap-3 sticky bottom-0 bg-background py-2 px-4 justify-end rounded-md border border-border">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center space-x-2 ${
            hasChanges && !isSaving
              ? "bg-[#1A5276] text-white hover:bg-[#001F3F] cursor-pointer"
              : "bg-[#1A5276]/40 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <ICONS.Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all text-sm ${
            hasChanges
              ? "bg-gray-500 text-white hover:bg-gray-400 cursor-pointer"
              : "bg-gray-400 text-gray-500 cursor-not-allowed"
          }`}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default KYCPreferencesPage;
