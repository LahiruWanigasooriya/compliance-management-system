'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Shield,
  Globe,
  AlertTriangle,
  Play,
  Loader2,
  Info,
  ChevronDown,
  Zap,
  Lock,
  Unlock,
  FileText,
  Settings,
  MapPin,
} from 'lucide-react';
import { Select } from "antd";
import { ComplianceStatus, GeoJurisdiction, GeofenceRule, SanctionedCountryRecord, SanctionLevel } from '@/types/geolocation.types';
import { getRiskBadgeClasses } from '@/constants/geolocation.constants';
import EmptyResult from '@/components/common/empty-result/EmptyResult';
import { ICONS } from '@/constants/constants';
import { useGeoJurisdictions } from '@/hooks/useGeolocationJurisdictions';
import { useGeofenceRules, useSanctionsList, useJurisdictionMutations, useSanctions } from '@/hooks/useGeofenceRules';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import { useTenant } from '@/components/providers/tenant.provider';
import { useAuth } from '@/components/providers/auth.provider';
import SummaryCard from '@/components/layout/SummaryCard';

// Tab type
type TabType = 'jurisdictions' | 'geofence-rules' | 'sanctions';

// Badge component
const Badge = ({ children, color }: { children: React.ReactNode; color: 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'yellow' | 'purple' }) => {
  const styles = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs capitalize border ${styles[color]}`}>
      {children}
    </span>
  );
};

const ComplianceBadge = ({ status }: { status: ComplianceStatus }) => {
  const map = {
    'allowed': { color: 'green' as const, icon: CheckCircle },
    'sanctioned': { color: 'orange' as const, icon: XCircle },
    'restricted': { color: 'yellow' as const, icon: HelpCircle },
    'blocked': { color: 'red' as const, icon: XCircle }
  };
  const config = map[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-4 h-4 ${status === 'allowed' ? 'text-green-600' : status === 'blocked' ? 'text-red-600' : status === 'restricted' ? 'text-yellow-600' : 'text-orange-600'}`} />
      <Badge color={config.color}>{status}</Badge>
    </div>
  );
};

const ActionBadge = ({ action }: { action: string }) => {
  const colorMap: Record<string, 'red' | 'orange' | 'yellow' | 'purple'> = {
    'block': 'red',
    'alert': 'orange',
    'flag': 'yellow',
    'step_up_auth': 'purple',
  };
  return <Badge color={colorMap[action] || 'gray'}>{action.replace('_', ' ')}</Badge>;
};

// Enhanced Modal component with modern styling
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  children,
  size = 'md',
  showCloseButton = true
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-all border border-gray-200/50 dark:border-slate-700/50`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-slate-800">
            {Icon && (
              <div className={`p-3 rounded-xl ${iconColorClasses[iconColor]} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -m-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Confirmation Modal with icon and better UX
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  isLoading = false,
  icon: CustomIcon
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'blue' | 'green';
  isLoading?: boolean;
  icon?: React.ElementType;
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const colorConfig = {
    red: {
      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    blue: {
      icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    green: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    },
  };

  const config = colorConfig[confirmColor];
  const IconComponent = CustomIcon || (confirmColor === 'red' ? AlertTriangle : confirmColor === 'green' ? CheckCircle : Info);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isLoading && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-gray-200/50 dark:border-slate-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${config.icon} shrink-0`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-600"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${config.button} flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern Form Section component
const FormSection = ({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800">
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
    {children}
  </div>
);

// Modern Input component
const FormInput = ({
  label,
  required,
  hint,
  error,
  ...props
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-slate-700'} rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm`}
    />
    {hint && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// Modern Select component
const FormSelect = ({
  label,
  required,
  hint,
  options,
  ...props
}: {
  label: string;
  required?: boolean;
  hint?: string;
  options: { value: string; label: string }[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'>) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        {...props}
        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer pr-10"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
    {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
  </div>
);

// Modern Toggle/Switch component
const FormToggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-10 h-6 bg-gray-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors" />
      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
    </div>
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{label}</span>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  </label>
);

// Modern Checkbox Card component
const CheckboxCard = ({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: React.ElementType;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
    checked
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
  }`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
      checked
        ? 'border-blue-600 bg-blue-600'
        : 'border-gray-300 dark:border-slate-600'
    }`}>
      {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
    </div>
    {Icon && (
      <Icon className={`w-4 h-4 shrink-0 ${checked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
    )}
    <div className="flex-1 min-w-0">
      <span className={`text-sm font-medium ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
      )}
    </div>
  </label>
);

// Modern Button component
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon: Icon,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20',
    secondary: 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${variants[variant]} ${sizes[size]} ${props.className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

const buildJurisdictionRules = (jurisdiction: GeoJurisdiction) => {
    if(!jurisdiction) return [];
    return (
        [
            {key: "allow_login", name: "Allow Login", type: "Access", value: jurisdiction.allow_login},
            {key: "allow_registration", name: "Allow Registration", type: "Access", value: jurisdiction.allow_registration},
            {key: "allow_transactions", name: "Allow Transactions", type: "Transaction", value: jurisdiction.allow_transactions},
            {key: "requires_kyc", name: "Requires KYC", type: "Compliance", value: jurisdiction.requires_kyc},
            {key: "requires_edd", name: "Requires EDD", type: "Compliance", value: jurisdiction.requires_edd},
        ]
    )
}

// Geofence Rule Form Modal
const GeofenceRuleFormModal = ({
  isOpen,
  onClose,
  rule,
  onSubmit,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  rule?: GeofenceRule | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    rule_type: rule?.rule_type || 'risk_threshold',
    priority: rule?.priority || 100,
    is_active: rule?.is_active ?? true,
    action: rule?.action || 'alert',
    alert_severity: rule?.alert_severity || 'medium',
    applies_to: rule?.applies_to || 'all',
    block_vpn: rule?.block_vpn || false,
    block_proxy: rule?.block_proxy || false,
    block_tor: rule?.block_tor || false,
    block_hosting: rule?.block_hosting || false,
    min_risk_threshold: rule?.min_risk_threshold || 0,
  });

  React.useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        rule_type: rule.rule_type || 'risk_threshold',
        priority: rule.priority || 100,
        is_active: rule.is_active ?? true,
        action: rule.action || 'alert',
        alert_severity: rule.alert_severity || 'medium',
        applies_to: rule.applies_to || 'all',
        block_vpn: rule.block_vpn || false,
        block_proxy: rule.block_proxy || false,
        block_tor: rule.block_tor || false,
        block_hosting: rule.block_hosting || false,
        min_risk_threshold: rule.min_risk_threshold || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        rule_type: 'risk_threshold',
        priority: 100,
        is_active: true,
        action: 'alert',
        alert_severity: 'medium',
        applies_to: 'all',
        block_vpn: false,
        block_proxy: false,
        block_tor: false,
        block_hosting: false,
        min_risk_threshold: 0,
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Edit Geofence Rule' : 'Create Geofence Rule'}
      subtitle={rule ? `Modify the configuration for "${rule.name}"` : 'Define a new rule to control access based on location'}
      icon={Shield}
      iconColor="purple"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <FormSection title="Basic Information" description="Name and describe your rule" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Rule Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., VPN Block Rule"
            />
            <FormInput
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
              placeholder="100"
              hint="Lower numbers = higher priority"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm resize-none"
              placeholder="Describe what this rule does..."
            />
          </div>
        </FormSection>

        {/* Rule Configuration Section */}
        <FormSection title="Rule Configuration" description="Define how this rule behaves" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              label="Rule Type"
              required
              value={formData.rule_type}
              onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as any })}
              options={[
                { value: 'risk_threshold', label: 'Risk Threshold' },
                { value: 'allow_list', label: 'Allow List' },
                { value: 'block_list', label: 'Block List' },
              ]}
            />
            <FormSelect
              label="Action"
              required
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
              options={[
                { value: 'alert', label: 'Alert' },
                { value: 'block', label: 'Block' },
                { value: 'flag', label: 'Flag' },
                { value: 'step_up_auth', label: 'Step-Up Auth' },
              ]}
            />
            <FormSelect
              label="Applies To"
              value={formData.applies_to}
              onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
              options={[
                { value: 'all', label: 'All Events' },
                { value: 'login', label: 'Login Only' },
                { value: 'registration', label: 'Registration Only' },
                { value: 'transaction', label: 'Transactions Only' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Alert Severity"
              value={formData.alert_severity}
              onChange={(e) => setFormData({ ...formData, alert_severity: e.target.value as any })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
            <FormInput
              label="Risk Threshold"
              type="number"
              min={0}
              max={100}
              value={formData.min_risk_threshold}
              onChange={(e) => setFormData({ ...formData, min_risk_threshold: parseFloat(e.target.value) || 0 })}
              hint="Trigger when risk score exceeds this (0-100)"
            />
          </div>
        </FormSection>

        {/* Anonymizer Detection Section */}
        <FormSection title="Anonymizer Detection" description="Block connections from anonymizing services" icon={Lock}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CheckboxCard
              label="VPN"
              description="Virtual Private Networks"
              checked={formData.block_vpn}
              onChange={(checked) => setFormData({ ...formData, block_vpn: checked })}
            />
            <CheckboxCard
              label="Proxy"
              description="Proxy servers"
              checked={formData.block_proxy}
              onChange={(checked) => setFormData({ ...formData, block_proxy: checked })}
            />
            <CheckboxCard
              label="Tor"
              description="Tor exit nodes"
              checked={formData.block_tor}
              onChange={(checked) => setFormData({ ...formData, block_tor: checked })}
            />
            <CheckboxCard
              label="Hosting"
              description="Datacenters & hosting"
              checked={formData.block_hosting}
              onChange={(checked) => setFormData({ ...formData, block_hosting: checked })}
            />
          </div>
        </FormSection>

        {/* Status Section */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
          <FormToggle
            label="Rule is active"
            description="When disabled, this rule will not be evaluated"
            checked={formData.is_active}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} icon={rule ? Edit : Plus}>
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Country list for jurisdiction creation
const COUNTRIES = [
  { iso: 'AF', name: 'Afghanistan' },
  { iso: 'AL', name: 'Albania' },
  { iso: 'DZ', name: 'Algeria' },
  { iso: 'AD', name: 'Andorra' },
  { iso: 'AO', name: 'Angola' },
  { iso: 'AR', name: 'Argentina' },
  { iso: 'AM', name: 'Armenia' },
  { iso: 'AU', name: 'Australia' },
  { iso: 'AT', name: 'Austria' },
  { iso: 'AZ', name: 'Azerbaijan' },
  { iso: 'BS', name: 'Bahamas' },
  { iso: 'BH', name: 'Bahrain' },
  { iso: 'BD', name: 'Bangladesh' },
  { iso: 'BY', name: 'Belarus' },
  { iso: 'BE', name: 'Belgium' },
  { iso: 'BZ', name: 'Belize' },
  { iso: 'BJ', name: 'Benin' },
  { iso: 'BT', name: 'Bhutan' },
  { iso: 'BO', name: 'Bolivia' },
  { iso: 'BA', name: 'Bosnia and Herzegovina' },
  { iso: 'BW', name: 'Botswana' },
  { iso: 'BR', name: 'Brazil' },
  { iso: 'BN', name: 'Brunei' },
  { iso: 'BG', name: 'Bulgaria' },
  { iso: 'KH', name: 'Cambodia' },
  { iso: 'CM', name: 'Cameroon' },
  { iso: 'CA', name: 'Canada' },
  { iso: 'CF', name: 'Central African Republic' },
  { iso: 'CL', name: 'Chile' },
  { iso: 'CN', name: 'China' },
  { iso: 'CO', name: 'Colombia' },
  { iso: 'CR', name: 'Costa Rica' },
  { iso: 'HR', name: 'Croatia' },
  { iso: 'CU', name: 'Cuba' },
  { iso: 'CY', name: 'Cyprus' },
  { iso: 'CZ', name: 'Czech Republic' },
  { iso: 'DK', name: 'Denmark' },
  { iso: 'DO', name: 'Dominican Republic' },
  { iso: 'EC', name: 'Ecuador' },
  { iso: 'EG', name: 'Egypt' },
  { iso: 'SV', name: 'El Salvador' },
  { iso: 'EE', name: 'Estonia' },
  { iso: 'ET', name: 'Ethiopia' },
  { iso: 'FI', name: 'Finland' },
  { iso: 'FR', name: 'France' },
  { iso: 'GE', name: 'Georgia' },
  { iso: 'DE', name: 'Germany' },
  { iso: 'GH', name: 'Ghana' },
  { iso: 'GR', name: 'Greece' },
  { iso: 'GT', name: 'Guatemala' },
  { iso: 'HN', name: 'Honduras' },
  { iso: 'HK', name: 'Hong Kong' },
  { iso: 'HU', name: 'Hungary' },
  { iso: 'IS', name: 'Iceland' },
  { iso: 'IN', name: 'India' },
  { iso: 'ID', name: 'Indonesia' },
  { iso: 'IR', name: 'Iran' },
  { iso: 'IQ', name: 'Iraq' },
  { iso: 'IE', name: 'Ireland' },
  { iso: 'IL', name: 'Israel' },
  { iso: 'IT', name: 'Italy' },
  { iso: 'JM', name: 'Jamaica' },
  { iso: 'JP', name: 'Japan' },
  { iso: 'JO', name: 'Jordan' },
  { iso: 'KZ', name: 'Kazakhstan' },
  { iso: 'KE', name: 'Kenya' },
  { iso: 'KP', name: 'North Korea' },
  { iso: 'KR', name: 'South Korea' },
  { iso: 'KW', name: 'Kuwait' },
  { iso: 'LV', name: 'Latvia' },
  { iso: 'LB', name: 'Lebanon' },
  { iso: 'LY', name: 'Libya' },
  { iso: 'LT', name: 'Lithuania' },
  { iso: 'LU', name: 'Luxembourg' },
  { iso: 'MY', name: 'Malaysia' },
  { iso: 'MT', name: 'Malta' },
  { iso: 'MX', name: 'Mexico' },
  { iso: 'MA', name: 'Morocco' },
  { iso: 'MM', name: 'Myanmar' },
  { iso: 'NL', name: 'Netherlands' },
  { iso: 'NZ', name: 'New Zealand' },
  { iso: 'NG', name: 'Nigeria' },
  { iso: 'NO', name: 'Norway' },
  { iso: 'OM', name: 'Oman' },
  { iso: 'PK', name: 'Pakistan' },
  { iso: 'PA', name: 'Panama' },
  { iso: 'PY', name: 'Paraguay' },
  { iso: 'PE', name: 'Peru' },
  { iso: 'PH', name: 'Philippines' },
  { iso: 'PL', name: 'Poland' },
  { iso: 'PT', name: 'Portugal' },
  { iso: 'QA', name: 'Qatar' },
  { iso: 'RO', name: 'Romania' },
  { iso: 'RU', name: 'Russia' },
  { iso: 'SA', name: 'Saudi Arabia' },
  { iso: 'RS', name: 'Serbia' },
  { iso: 'SG', name: 'Singapore' },
  { iso: 'SK', name: 'Slovakia' },
  { iso: 'SI', name: 'Slovenia' },
  { iso: 'SO', name: 'Somalia' },
  { iso: 'ZA', name: 'South Africa' },
  { iso: 'SS', name: 'South Sudan' },
  { iso: 'ES', name: 'Spain' },
  { iso: 'LK', name: 'Sri Lanka' },
  { iso: 'SD', name: 'Sudan' },
  { iso: 'SE', name: 'Sweden' },
  { iso: 'CH', name: 'Switzerland' },
  { iso: 'SY', name: 'Syria' },
  { iso: 'TW', name: 'Taiwan' },
  { iso: 'TH', name: 'Thailand' },
  { iso: 'TR', name: 'Turkey' },
  { iso: 'UA', name: 'Ukraine' },
  { iso: 'AE', name: 'United Arab Emirates' },
  { iso: 'GB', name: 'United Kingdom' },
  { iso: 'US', name: 'United States' },
  { iso: 'UY', name: 'Uruguay' },
  { iso: 'VE', name: 'Venezuela' },
  { iso: 'VN', name: 'Vietnam' },
  { iso: 'YE', name: 'Yemen' },
  { iso: 'ZW', name: 'Zimbabwe' },
];

// Jurisdiction Create Modal
const JurisdictionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  existingJurisdictions
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  existingJurisdictions: GeoJurisdiction[];
}) => {
  const [formData, setFormData] = useState({
    country_iso: '',
    country_name: '',
    status: 'allowed' as ComplianceStatus,
    risk_level: 'low',
    requires_kyc: false,
    requires_edd: false,
    allow_login: true,
    allow_registration: true,
    allow_transactions: true,
    notes: '',
    regulatory_body: '',
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter out countries that already have jurisdictions
  const existingIsos = new Set(existingJurisdictions.map(j => j.country_iso));
  const availableCountries = COUNTRIES.filter(c => !existingIsos.has(c.iso));
  const filteredCountries = availableCountries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSelectCountry = (country: { iso: string; name: string }) => {
    setFormData({ ...formData, country_iso: country.iso, country_name: country.name });
    setCountrySearch('');
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country_iso) return;
    onSubmit(formData);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        country_iso: '',
        country_name: '',
        status: 'allowed',
        risk_level: 'low',
        requires_kyc: false,
        requires_edd: false,
        allow_login: true,
        allow_registration: true,
        allow_transactions: true,
        notes: '',
        regulatory_body: '',
      });
      setCountrySearch('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Jurisdiction"
      subtitle="Configure compliance settings for a new country"
      icon={Globe}
      iconColor="blue"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Country Selection Section */}
        <FormSection title="Select Country" description="Choose the country to configure" icon={MapPin}>
          {formData.country_iso ? (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{formData.country_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ISO Code: {formData.country_iso}</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, country_iso: '', country_name: '' })}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => { setCountrySearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="Type to search for a country..."
                />
              </div>
              {showDropdown && (countrySearch || filteredCountries.length > 0) && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    <div className="p-2">
                      {filteredCountries.slice(0, 10).map(country => (
                        <button
                          key={country.iso}
                          type="button"
                          onClick={() => handleSelectCountry(country)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                              <Globe className="w-4 h-4 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{country.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{country.iso}</span>
                        </button>
                      ))}
                      {filteredCountries.length > 10 && (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center border-t border-gray-100 dark:border-slate-700 mt-2">
                          {filteredCountries.length - 10} more countries...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No countries found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Status & Risk Section */}
        <FormSection title="Status & Risk" description="Define the compliance status and risk level" icon={AlertTriangle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Compliance Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ComplianceStatus })}
              options={[
                { value: 'allowed', label: 'Allowed' },
                { value: 'restricted', label: 'Restricted' },
                { value: 'blocked', label: 'Blocked' },
                { value: 'sanctioned', label: 'Sanctioned' },
              ]}
            />
            <FormSelect
              label="Risk Level"
              value={formData.risk_level}
              onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>
        </FormSection>

        {/* Access Controls Section */}
        <FormSection title="Access Controls" description="What actions are permitted from this jurisdiction" icon={Unlock}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CheckboxCard
              label="Allow Login"
              description="Users can sign in"
              checked={formData.allow_login}
              onChange={(checked) => setFormData({ ...formData, allow_login: checked })}
            />
            <CheckboxCard
              label="Allow Registration"
              description="New users can sign up"
              checked={formData.allow_registration}
              onChange={(checked) => setFormData({ ...formData, allow_registration: checked })}
            />
            <CheckboxCard
              label="Allow Transactions"
              description="Financial operations"
              checked={formData.allow_transactions}
              onChange={(checked) => setFormData({ ...formData, allow_transactions: checked })}
            />
          </div>
        </FormSection>

        {/* Compliance Requirements Section */}
        <FormSection title="Compliance Requirements" description="Additional verification requirements" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CheckboxCard
              label="Requires KYC"
              description="Know Your Customer verification"
              checked={formData.requires_kyc}
              onChange={(checked) => setFormData({ ...formData, requires_kyc: checked })}
            />
            <CheckboxCard
              label="Requires EDD"
              description="Enhanced Due Diligence"
              checked={formData.requires_edd}
              onChange={(checked) => setFormData({ ...formData, requires_edd: checked })}
            />
          </div>
        </FormSection>

        {/* Additional Info Section */}
        <FormSection title="Additional Information" description="Optional details and notes" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Regulatory Body"
              value={formData.regulatory_body}
              onChange={(e) => setFormData({ ...formData, regulatory_body: e.target.value })}
              placeholder="e.g., FCA, SEC, MAS"
            />
            <FormInput
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!formData.country_iso} icon={Plus}>
            Create Jurisdiction
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Jurisdiction Edit Modal
const JurisdictionEditModal = ({
  isOpen,
  onClose,
  jurisdiction,
  onSubmit,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  jurisdiction: GeoJurisdiction | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    status: jurisdiction?.status || 'allowed',
    risk_level: jurisdiction?.risk_level || 'low',
    requires_kyc: jurisdiction?.requires_kyc || false,
    requires_edd: jurisdiction?.requires_edd || false,
    allow_login: jurisdiction?.allow_login ?? true,
    allow_registration: jurisdiction?.allow_registration ?? true,
    allow_transactions: jurisdiction?.allow_transactions ?? true,
    notes: jurisdiction?.notes || '',
    regulatory_body: jurisdiction?.regulatory_body || '',
  });

  React.useEffect(() => {
    if (jurisdiction) {
      setFormData({
        status: jurisdiction.status || 'allowed',
        risk_level: jurisdiction.risk_level || 'low',
        requires_kyc: jurisdiction.requires_kyc || false,
        requires_edd: jurisdiction.requires_edd || false,
        allow_login: jurisdiction.allow_login ?? true,
        allow_registration: jurisdiction.allow_registration ?? true,
        allow_transactions: jurisdiction.allow_transactions ?? true,
        notes: jurisdiction.notes || '',
        regulatory_body: jurisdiction.regulatory_body || '',
      });
    }
  }, [jurisdiction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen || !jurisdiction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${jurisdiction.country_name}`}
      subtitle="Update jurisdiction compliance settings"
      icon={Edit}
      iconColor="blue"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Country Header */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{jurisdiction.country_name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ISO Code: {jurisdiction.country_iso}</div>
          </div>
          <ComplianceBadge status={jurisdiction.status} />
        </div>

        {/* Status & Risk Section */}
        <FormSection title="Status & Risk" description="Define the compliance status and risk level" icon={AlertTriangle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Compliance Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'allowed', label: 'Allowed' },
                { value: 'restricted', label: 'Restricted' },
                { value: 'blocked', label: 'Blocked' },
                { value: 'sanctioned', label: 'Sanctioned' },
              ]}
            />
            <FormSelect
              label="Risk Level"
              value={formData.risk_level}
              onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>
        </FormSection>

        {/* Access Controls Section */}
        <FormSection title="Access Controls" description="What actions are permitted from this jurisdiction" icon={Unlock}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CheckboxCard
              label="Allow Login"
              description="Users can sign in"
              checked={formData.allow_login}
              onChange={(checked) => setFormData({ ...formData, allow_login: checked })}
            />
            <CheckboxCard
              label="Allow Registration"
              description="New users can sign up"
              checked={formData.allow_registration}
              onChange={(checked) => setFormData({ ...formData, allow_registration: checked })}
            />
            <CheckboxCard
              label="Allow Transactions"
              description="Financial operations"
              checked={formData.allow_transactions}
              onChange={(checked) => setFormData({ ...formData, allow_transactions: checked })}
            />
          </div>
        </FormSection>

        {/* Compliance Requirements Section */}
        <FormSection title="Compliance Requirements" description="Additional verification requirements" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CheckboxCard
              label="Requires KYC"
              description="Know Your Customer verification"
              checked={formData.requires_kyc}
              onChange={(checked) => setFormData({ ...formData, requires_kyc: checked })}
            />
            <CheckboxCard
              label="Requires EDD"
              description="Enhanced Due Diligence"
              checked={formData.requires_edd}
              onChange={(checked) => setFormData({ ...formData, requires_edd: checked })}
            />
          </div>
        </FormSection>

        {/* Additional Info Section */}
        <FormSection title="Additional Information" description="Optional details and notes" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Regulatory Body"
              value={formData.regulatory_body}
              onChange={(e) => setFormData({ ...formData, regulatory_body: e.target.value })}
              placeholder="e.g., FCA, SEC, MAS"
            />
            <FormInput
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} icon={CheckCircle}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Sanction Form Modal (Create/Edit)
const SanctionFormModal = ({
  isOpen,
  onClose,
  sanction,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionedCountryRecord | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) => {
  const isEditing = !!sanction;
  const [formData, setFormData] = useState({
    country_iso: '',
    country_name: '',
    sanction_source: 'OFAC',
    sanction_level: 'comprehensive' as SanctionLevel,
    programs: '',
    description: '',
    effective_date: '',
    expiry_date: '',
    is_active: true,
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSelectCountry = (country: { iso: string; name: string }) => {
    setFormData({ ...formData, country_iso: country.iso, country_name: country.name });
    setCountrySearch('');
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country_iso || !formData.sanction_source) return;

    // Convert programs string to array (split by comma)
    const submitData = {
      ...formData,
      programs: formData.programs
        ? formData.programs.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : undefined,
    };
    onSubmit(submitData);
  };

  // Initialize form when editing or reset when creating
  React.useEffect(() => {
    if (isOpen && sanction) {
      // Parse programs from JSON array string to comma-separated string for display
      let programsStr = '';
      if (sanction.programs) {
        try {
          const programsArr = JSON.parse(sanction.programs);
          if (Array.isArray(programsArr)) {
            programsStr = programsArr.join(', ');
          } else {
            programsStr = sanction.programs;
          }
        } catch {
          // If not valid JSON, use as-is
          programsStr = sanction.programs;
        }
      }

      setFormData({
        country_iso: sanction.country_iso,
        country_name: sanction.country_name,
        sanction_source: sanction.sanction_source,
        sanction_level: sanction.sanction_level,
        programs: programsStr,
        description: sanction.description || '',
        effective_date: sanction.effective_date ? sanction.effective_date.split('T')[0] : '',
        expiry_date: sanction.expiry_date ? sanction.expiry_date.split('T')[0] : '',
        is_active: sanction.is_active,
      });
    } else if (!isOpen) {
      setFormData({
        country_iso: '',
        country_name: '',
        sanction_source: 'OFAC',
        sanction_level: 'comprehensive',
        programs: '',
        description: '',
        effective_date: '',
        expiry_date: '',
        is_active: true,
      });
      setCountrySearch('');
      setShowDropdown(false);
    }
  }, [isOpen, sanction]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Sanction' : 'Add New Sanction'}
      subtitle={isEditing ? 'Update sanction details' : 'Add a new sanctioned country'}
      icon={AlertTriangle}
      iconColor="orange"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Country Selection Section */}
        <FormSection title="Country" description="Select the sanctioned country" icon={Globe}>
          {formData.country_iso ? (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
              <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-xl">
                <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{formData.country_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ISO Code: {formData.country_iso}</div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, country_iso: '', country_name: '' })}
                  className="p-2 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => { setCountrySearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                  placeholder="Type to search for a country..."
                />
              </div>
              {showDropdown && (countrySearch || filteredCountries.length > 0) && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    <div className="p-2">
                      {filteredCountries.slice(0, 10).map(country => (
                        <button
                          key={country.iso}
                          type="button"
                          onClick={() => handleSelectCountry(country)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-slate-700 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900 transition-colors">
                              <Globe className="w-4 h-4 text-gray-500 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{country.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{country.iso}</span>
                        </button>
                      ))}
                      {filteredCountries.length > 10 && (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center border-t border-gray-100 dark:border-slate-700 mt-2">
                          {filteredCountries.length - 10} more countries...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No countries found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Sanction Details Section */}
        <FormSection title="Sanction Details" description="Configure sanction source and level" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Sanction Source"
              value={formData.sanction_source}
              onChange={(e) => setFormData({ ...formData, sanction_source: e.target.value })}
              options={[
                { value: 'OFAC', label: 'OFAC (U.S. Treasury)' },
                { value: 'EU', label: 'European Union' },
                { value: 'UN', label: 'United Nations' },
                { value: 'UK', label: 'UK Treasury' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <FormSelect
              label="Sanction Level"
              value={formData.sanction_level}
              onChange={(e) => setFormData({ ...formData, sanction_level: e.target.value as SanctionLevel })}
              options={[
                { value: 'comprehensive', label: 'Comprehensive' },
                { value: 'partial', label: 'Partial' },
                { value: 'sectoral', label: 'Sectoral' },
              ]}
            />
          </div>
        </FormSection>

        {/* Additional Details Section */}
        <FormSection title="Additional Information" description="Programs and description" icon={FileText}>
          <div className="space-y-4">
            <FormInput
              label="Programs"
              value={formData.programs}
              onChange={(e) => setFormData({ ...formData, programs: e.target.value })}
              placeholder="e.g., Cuba Sanctions Program, Iran Sanctions"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all resize-none"
                rows={3}
                placeholder="Enter description of the sanction..."
              />
            </div>
          </div>
        </FormSection>

        {/* Dates Section */}
        <FormSection title="Effective Dates" description="When the sanction is in effect" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Effective Date"
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            />
            <FormInput
              label="Expiry Date (Optional)"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>
        </FormSection>

        {/* Active Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <label htmlFor="is_active" className="flex-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">Active Sanction</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">This sanction will be enforced if active</p>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!formData.country_iso} icon={isEditing ? CheckCircle : Plus}>
            {isEditing ? 'Save Changes' : 'Add Sanction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Test Rule Modal
const TestRuleModal = ({
  isOpen,
  onClose,
  rule,
  onTest,
  isLoading,
  testResult
}: {
  isOpen: boolean;
  onClose: () => void;
  rule: GeofenceRule | null;
  onTest: (ipAddress: string, eventType: string) => void;
  isLoading: boolean;
  testResult: any;
}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [eventType, setEventType] = useState('login');

  if (!isOpen || !rule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test Rule: ${rule.name}`}
      subtitle="Simulate how this rule evaluates a request from a specific IP address"
      icon={Zap}
      iconColor="orange"
      size="lg"
    >
      <div className="space-y-6">
        {/* Rule Info Card */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Type: {rule.rule_type.replace('_', ' ')} | Action: {rule.action}
            </div>
          </div>
          <Badge color={rule.is_active ? 'green' : 'gray'}>{rule.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>

        {/* Test Inputs */}
        <FormSection title="Test Parameters" description="Enter the IP address and event type to test" icon={Play}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="IP Address"
              required
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 8.8.8.8 or 185.220.101.1"
            />
            <FormSelect
              label="Event Type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              options={[
                { value: 'login', label: 'Login' },
                { value: 'registration', label: 'Registration' },
                { value: 'transaction', label: 'Transaction' },
              ]}
            />
          </div>
        </FormSection>

        <Button
          onClick={() => onTest(ipAddress, eventType)}
          disabled={!ipAddress}
          isLoading={isLoading}
          icon={Play}
          className="w-full"
        >
          {isLoading ? 'Running Test...' : 'Run Test'}
        </Button>

        {testResult && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Test Results
            </h4>

            {/* Result Status Card */}
            <div className={`p-5 rounded-xl border-2 ${
              testResult.evaluation?.is_blocked
                ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-700'
                : 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-300 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-700'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  testResult.evaluation?.is_blocked
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : 'bg-emerald-100 dark:bg-emerald-900/40'
                }`}>
                  {testResult.evaluation?.is_blocked ? (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <span className={`text-lg font-bold ${
                    testResult.evaluation?.is_blocked
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {testResult.evaluation?.is_blocked ? 'REQUEST BLOCKED' : 'REQUEST ALLOWED'}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Action: {testResult.evaluation?.action || 'None'}
                  </p>
                </div>
              </div>

              {testResult.evaluation?.block_reasons?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700/50">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Block Reasons:</p>
                  <div className="space-y-1.5">
                    {testResult.evaluation.block_reasons.map((reason: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location Info */}
            {testResult.location && (
              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  IP Location Details
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Country</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{testResult.location.country}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ISO Code</p>
                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{testResult.location.country_iso}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">City</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{testResult.location.city || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Anonymizer Detection</p>
                  <div className="flex flex-wrap gap-2">
                    {['VPN', 'Proxy', 'Tor', 'Hosting'].map((type) => {
                      const key = `is_${type.toLowerCase()}` as keyof typeof testResult.location;
                      const isDetected = testResult.location[key];
                      return (
                        <div
                          key={type}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                            isDetected
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                          }`}
                        >
                          {isDetected ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {type}: {isDetected ? 'Detected' : 'Clear'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default function GeolocationRulesPage() {
  const { isSwitchingTenant } = useTenant();
  const { isSystemUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Ensure consistent rendering during hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Jurisdictions hook
  const {
    jurisdictions,
    loading: jurisdictionsLoading,
    isFetching: jurisdictionsFetching,
    refresh: refreshJurisdictions,
  } = useGeoJurisdictions();

  // Geofence rules hook
  const {
    rules,
    total: rulesTotal,
    loading: rulesLoading,
    isFetching: rulesFetching,
    refresh: refreshRules,
    createRule,
    updateRule,
    deleteRule,
    activateRule,
    deactivateRule,
    testRule,
    isCreating,
    isUpdating,
    isDeleting,
    isTesting,
  } = useGeofenceRules({ sort_by: 'priority' });

  // Sanctions list hook (for summary/screen)
  const {
    totalCount: sanctionsTotal,
    sources: sanctionsSources,
    loading: sanctionsLoading,
    isFetching: sanctionsFetching,
    refresh: refreshSanctions,
    screenCountry,
    isScreening,
  } = useSanctionsList();

  // Sanctions CRUD hook
  const {
    sanctions: sanctionRecords,
    refresh: refreshSanctionRecords,
    createSanction,
    updateSanction: updateSanctionMutation,
    deleteSanction: deleteSanctionMutation,
    isCreating: isCreatingSanction,
    isUpdating: isUpdatingSanction,
    isDeleting: isDeletingSanction,
  } = useSanctions();

  // Jurisdiction mutations
  const {
    createJurisdiction,
    updateJurisdiction,
    deleteJurisdiction,
    isCreating: isCreatingJurisdiction,
    isUpdating: isUpdatingJurisdiction,
    isDeleting: isDeletingJurisdiction,
  } = useJurisdictionMutations();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('jurisdictions');
  const [globalSearch, setGlobalSearch] = useState('');

  // Jurisdiction State
  const [jStatusFilter, setJStatusFilter] = useState<ComplianceStatus[]>([]);
  const [jPage, setJPage] = useState(1);
  const J_PAGE_SIZE = 10;
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<GeoJurisdiction | null>(null);
  const [editingJurisdiction, setEditingJurisdiction] = useState<GeoJurisdiction | null>(null);
  const [showJurisdictionForm, setShowJurisdictionForm] = useState(false);
  const [deleteJurisdictionConfirm, setDeleteJurisdictionConfirm] = useState<{ show: boolean; jurisdiction: GeoJurisdiction | null }>({ show: false, jurisdiction: null });

  // Geofence Rules State
  const [rPage, setRPage] = useState(1);
  const R_PAGE_SIZE = 10;
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<GeofenceRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; rule: GeofenceRule | null }>({ show: false, rule: null });
  const [testingRule, setTestingRule] = useState<GeofenceRule | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Sanctions State
  const [sanctionLevelFilter, setSanctionLevelFilter] = useState<string[]>([]);
  const [sanctionSourceFilter, setSanctionSourceFilter] = useState<string[]>([]);
  const [showScreenCountryModal, setShowScreenCountryModal] = useState(false);
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [selectedSanction, setSelectedSanction] = useState<any>(null);
  const [showSanctionForm, setShowSanctionForm] = useState(false);
  const [editingSanction, setEditingSanction] = useState<SanctionedCountryRecord | null>(null);
  const [deleteSanctionConfirm, setDeleteSanctionConfirm] = useState<{ show: boolean; sanction: SanctionedCountryRecord | null }>({ show: false, sanction: null });

  // Filtering Logic
  const filteredJurisdictions = useMemo(() => {
    if (!Array.isArray(jurisdictions)) return [];
    return jurisdictions.filter(j => {
      const matchesSearch = j.country_name.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesStatus = jStatusFilter.length === 0 || jStatusFilter.includes(j.status);
      return matchesSearch && matchesStatus;
    });
  }, [globalSearch, jStatusFilter, jurisdictions]);

  const filteredRules = useMemo(() => {
    if (!Array.isArray(rules)) return [];
    return rules.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (r.description?.toLowerCase().includes(globalSearch.toLowerCase()));
      return matchesSearch;
    });
  }, [globalSearch, rules]);

  const filteredSanctions = useMemo(() => {
    // Use sanctionRecords from CRUD hook for the editable list
    if (!Array.isArray(sanctionRecords)) return [];
    return sanctionRecords.filter(s => {
      const matchesSearch = s.country_name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.country_iso?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.sanction_source?.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesLevel = sanctionLevelFilter.length === 0 || sanctionLevelFilter.includes(s.sanction_level);
      const matchesSource = sanctionSourceFilter.length === 0 || sanctionSourceFilter.includes(s.sanction_source);
      return matchesSearch && matchesLevel && matchesSource;
    });
  }, [globalSearch, sanctionRecords, sanctionLevelFilter, sanctionSourceFilter]);

  // Sanctions stats
  const sanctionsStats = useMemo(() => {
    if (!Array.isArray(sanctionRecords)) return { comprehensive: 0, partial: 0, sectoral: 0, bySource: {} as Record<string, number> };
    const stats = {
      comprehensive: 0,
      partial: 0,
      sectoral: 0,
      bySource: {} as Record<string, number>,
    };
    sanctionRecords.forEach(s => {
      if (s.sanction_level === 'comprehensive') stats.comprehensive++;
      else if (s.sanction_level === 'partial') stats.partial++;
      else if (s.sanction_level === 'sectoral') stats.sectoral++;
      if (s.sanction_source) {
        stats.bySource[s.sanction_source] = (stats.bySource[s.sanction_source] || 0) + 1;
      }
    });
    return stats;
  }, [sanctionRecords]);

  // Pagination
  const paginate = <T,>(items: T[], page: number, size: number) => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  };

  const paginatedJurisdictions = paginate(filteredJurisdictions, jPage, J_PAGE_SIZE);
  const jTotalPages = Math.ceil(filteredJurisdictions.length / J_PAGE_SIZE);

  const paginatedRules = paginate(filteredRules, rPage, R_PAGE_SIZE);
  const rTotalPages = Math.ceil(filteredRules.length / R_PAGE_SIZE);

  // Handlers
  const handleClearAll = () => {
    setGlobalSearch('');
    setJStatusFilter([]);
    setJPage(1);
    setRPage(1);
  };

  const toggleJStatus = (status: ComplianceStatus) => {
    setJStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setJPage(1);
  };

  const handleRefresh = () => {
    if (activeTab === 'jurisdictions') refreshJurisdictions();
    else if (activeTab === 'geofence-rules') refreshRules();
    else if (activeTab === 'sanctions') {
      refreshSanctions();
      refreshSanctionRecords();
    }
  };

  const handleCreateRule = async (data: any) => {
    await createRule(data);
    setShowRuleForm(false);
  };

  const handleUpdateRule = async (data: any) => {
    if (editingRule) {
      await updateRule({ ruleId: editingRule.id, input: data });
      setEditingRule(null);
    }
  };

  const handleDeleteRule = async () => {
    if (deleteConfirm.rule) {
      await deleteRule(deleteConfirm.rule.id);
      setDeleteConfirm({ show: false, rule: null });
    }
  };

  const handleToggleRuleActive = async (rule: GeofenceRule) => {
    if (rule.is_active) {
      await deactivateRule(rule.id);
    } else {
      await activateRule(rule.id);
    }
  };

  const handleTestRule = async (ipAddress: string, eventType: string) => {
    if (testingRule) {
      const result = await testRule({ ruleId: testingRule.id, input: { ip_address: ipAddress, event_type: eventType } });
      setTestResult(result);
    }
  };

  const handleCreateJurisdiction = async (data: any) => {
    await createJurisdiction(data);
    setShowJurisdictionForm(false);
  };

  const handleUpdateJurisdiction = async (data: any) => {
    if (editingJurisdiction) {
      await updateJurisdiction({ jurisdictionId: editingJurisdiction.id, input: data });
      setEditingJurisdiction(null);
    }
  };

  const handleDeleteJurisdiction = async () => {
    if (deleteJurisdictionConfirm.jurisdiction) {
      await deleteJurisdiction(deleteJurisdictionConfirm.jurisdiction.id);
      setDeleteJurisdictionConfirm({ show: false, jurisdiction: null });
    }
  };

  const handleScreenCountry = async (countryIso: string) => {
    try {
      const result = await screenCountry(countryIso);
      setScreeningResult(result);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Sanction CRUD handlers
  const handleCreateSanction = async (data: any) => {
    await createSanction(data);
    setShowSanctionForm(false);
    setEditingSanction(null);
  };

  const handleUpdateSanction = async (data: any) => {
    if (editingSanction) {
      await updateSanctionMutation({ sanctionId: editingSanction.id, input: data });
      setShowSanctionForm(false);
      setEditingSanction(null);
    }
  };

  const handleDeleteSanction = async () => {
    if (deleteSanctionConfirm.sanction) {
      await deleteSanctionMutation(deleteSanctionConfirm.sanction.id);
      setDeleteSanctionConfirm({ show: false, sanction: null });
    }
  };

  const toggleSanctionLevel = (level: string) => {
    setSanctionLevelFilter(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleSanctionSource = (source: string) => {
    setSanctionSourceFilter(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const loading = activeTab === 'jurisdictions' ? jurisdictionsLoading :
                  activeTab === 'geofence-rules' ? rulesLoading : sanctionsLoading;
  const isFetching = activeTab === 'jurisdictions' ? jurisdictionsFetching :
                     activeTab === 'geofence-rules' ? rulesFetching : sanctionsFetching;

  // Show loading only after mount to prevent hydration mismatch
  if (!mounted || (loading && !isSwitchingTenant)) {
    return (
      <LoadingOverlay
        className="-inset-4!"
        loadingText="Loading..."
      />
    );
  }

  return (
    <div className="relative font-sans text-gray-800">
      {/* Header Section */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Geolocation Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 dark:text-gray-400">
            Manage jurisdictions, geofence rules, and sanctions screening
          </p>
        </div>
        <div className="flex items-center space-x-2 gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center cursor-pointer gap-2 px-3 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50 bg-card"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Stats Section (If applicable, showing simplified for now or Tabs first) */}
      {/* Moving Tabs to be distinct before the filter card */}
      <div className="mb-6">
        <div className="flex gap-1 border-b border-panel-border">
          {[
            {
              id: "jurisdictions" as const,
              label: "Jurisdictions",
              icon: Globe,
              count: jurisdictions.length,
            },
            {
              id: "geofence-rules" as const,
              label: "Geofence Rules",
              icon: Shield,
              count: rulesTotal,
            },
            {
              id: "sanctions" as const,
              label: "Sanctions",
              icon: AlertTriangle,
              count: sanctionsTotal,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-secondary text-secondary font-bold!"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder={
                activeTab === "jurisdictions"
                  ? "Search by Country or ISO code..."
                  : activeTab === "geofence-rules"
                  ? "Search rules..."
                  : "Search sanctioned entities..."
              }
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Filter Triggers */}
            {activeTab === "jurisdictions" && (
              <Select
                mode="multiple"
                placeholder="Status"
                value={jStatusFilter}
                onChange={(values) => setJStatusFilter(values as ComplianceStatus[])}
                style={{ minWidth: 160, height: 42 }}
                allowClear
                maxTagCount="responsive"
                options={[
                  { label: "Allowed", value: "allowed" },
                  { label: "Restricted", value: "restricted" },
                  { label: "Blocked", value: "blocked" },
                  { label: "Sanctioned", value: "sanctioned" },
                ]}
              />
            )}

            {/* Sanctions Filters */}
            {activeTab === "sanctions" && (
              <>
                <Select
                  mode="multiple"
                  placeholder="Level"
                  value={sanctionLevelFilter}
                  onChange={(values) => setSanctionLevelFilter(values as string[])}
                  style={{ minWidth: 140, height: 42 }}
                  allowClear
                  maxTagCount="responsive"
                  options={[
                    { label: "Comprehensive", value: "comprehensive" },
                    { label: "Partial", value: "partial" },
                    { label: "Sectoral", value: "sectoral" },
                  ]}
                />
                <Select
                  mode="multiple"
                  placeholder="Source"
                  value={sanctionSourceFilter}
                  onChange={(values) => setSanctionSourceFilter(values as string[])}
                  style={{ minWidth: 140, height: 42 }}
                  allowClear
                  maxTagCount="responsive"
                  options={sanctionsSources.map(source => ({ label: source, value: source }))}
                />
              </>
            )}

            {/* Action Buttons inside the filter row */}
            {activeTab === "jurisdictions" && !isSystemUser && (
              <button
                onClick={() => setShowJurisdictionForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden xl:inline">Add Jurisdiction</span>
                <span className="xl:hidden">Add</span>
              </button>
            )}
            {activeTab === "geofence-rules" && !isSystemUser && (
              <button
                onClick={() => {
                  setEditingRule(null);
                  setShowRuleForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} />
                <span className="hidden xl:inline">Add Rule</span>
                <span className="xl:hidden">Add</span>
              </button>
            )}
            {activeTab === "sanctions" && (
              <>
                <button
                  onClick={() => setShowScreenCountryModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-panel-border text-foreground rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Search size={16} />
                  <span className="hidden xl:inline">Screen Country</span>
                </button>
                {!isSystemUser && (
                  <button
                    onClick={() => {
                      setEditingSanction(null);
                      setShowSanctionForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={16} />
                    <span className="hidden xl:inline">Add Sanction</span>
                    <span className="xl:hidden">Add</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Saved Filters Row (Visual Match) */}
        {(globalSearch || jStatusFilter.length > 0) && (
           <div className="mt-4 pt-3 border-t border-panel-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold text-muted-foreground uppercase">Active Filters:</span>
                 {globalSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-900/30">
                       Query: {globalSearch}
                       <button onClick={() => setGlobalSearch("")} className="hover:text-blue-900"><X size={12}/></button>
                    </span>
                 )}
              </div>
              <button
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted cursor-pointer"
              >
                Clear all
              </button>
           </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'jurisdictions' && (
        <>
        <div className="pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
                {/* <span className="w-1 h-5 bg-secondary rounded-full"></span> */}
                Jurisdiction Configuration
              </h2>
            </div>
          </div>
          <section className="bg-card rounded-xl shadow-sm border border-panel-border overflow-hidden">
            {/* <div className="p-6 border-b border-panel-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
                  <span className="w-1 h-5 bg-secondary rounded-full"></span>
                  Jurisdiction Configuration
                </h2>
              </div>
            </div> */}
            {jurisdictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary text-white dark:bg-secondary font-medium">
                      <tr>
                      <th className="px-3 py-3.25">Country</th>
                      <th className="px-3 py-3.25">Status</th>
                      <th className="px-3 py-3.25">Risk Level</th>
                      <th className="px-3 py-3.25">Access Controls</th>
                      <th className="px-3 py-3.25">Notes</th>
                      <th className="px-3 py-3.25 text-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                    {paginatedJurisdictions.map((j) => (
                      <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-3 py-1.75 font-medium text-gray-900 dark:text-gray-100">{j.country_name}</td>
                        <td className="px-3 py-1.75"><ComplianceBadge status={j.status} /></td>
                        <td className="px-3 py-1.75">
                          <span className={`capitalize border-none ${getRiskBadgeClasses(j.risk_level)}`}>{j.risk_level}</span>
                        </td>
                        <td className="px-3 py-1.75">
                          <div className="flex gap-1">
                            {j.allow_login && <Badge color="blue">Login</Badge>}
                            {j.allow_registration && <Badge color="blue">Reg</Badge>}
                            {j.allow_transactions && <Badge color="blue">Txn</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-1.75 text-gray-500 dark:text-gray-400 max-w-xs truncate">{j.notes || '-'}</td>
                        <td className="px-3 py-1.75">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedJurisdiction(j)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {!isSystemUser && (
                              <>
                                <button
                                  onClick={() => setEditingJurisdiction(j)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => setDeleteJurisdictionConfirm({ show: true, jurisdiction: j })}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyResult
                title="No Jurisdictions Found"
                description="No jurisdiction configurations to display"
                icon={<ICONS.Settings className="mx-auto text-muted-foreground mb-4 dark:text-gray-500" size={48}/>}
                className="border-none shadow-none"
              />
            )}
            {jTotalPages > 1 && (
              <div className="p-4 border-t border-panel-border flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Page {jPage} of {jTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={jPage === 1}
                    onClick={() => setJPage(p => p - 1)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 dark:text-gray-300" />
                  </button>
                  <button
                    disabled={jPage === jTotalPages}
                    onClick={() => setJPage(p => p + 1)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'geofence-rules' && (
        <>
          <div className="pb-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
                {/* <span className="w-1 h-5 bg-purple-500 rounded-full"></span> */}
                Geofence Rules
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure rules to control access based on location, IP, and risk factors
              </p>
            </div>
          </div>
          <section className="bg-card rounded-xl shadow-sm border border-panel-border overflow-hidden">
            {rules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary text-white dark:bg-secondary font-medium">
                    <tr>
                      <th className="px-3 py-3.25">Priority</th>
                      <th className="px-3 py-3.25">Rule Name</th>
                      <th className="px-3 py-3.25">Type</th>
                      <th className="px-3 py-3.25">Action</th>
                      <th className="px-3 py-3.25">Applies To</th>
                      <th className="px-3 py-3.25">Status</th>
                      <th className="px-3 py-3.25 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
                    {paginatedRules.map((rule) => (
                      <tr
                        key={rule.id}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${!rule.is_active ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-1.75">
                          <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {rule.priority}
                          </span>
                        </td>
                        <td className="px-3 py-1.75">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</div>
                            {rule.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-1.75">
                          <Badge color="blue">{rule.rule_type.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-3 py-1.75">
                          <ActionBadge action={rule.action} />
                        </td>
                        <td className="px-3 py-1.75">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{rule.applies_to || 'All'}</span>
                        </td>
                        <td className="px-3 py-1.75">
                          <Badge color={rule.is_active ? 'green' : 'gray'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.75">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setTestingRule(rule);
                                setTestResult(null);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Test rule"
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </button>
                            {!isSystemUser && (
                              <>
                                <button
                                  onClick={() => handleToggleRuleActive(rule)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title={rule.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {rule.is_active ? (
                                    <PowerOff className="w-4 h-4 text-orange-600" />
                                  ) : (
                                    <Power className="w-4 h-4 text-green-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setShowRuleForm(true);
                                  }}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ show: true, rule })}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyResult
                title="No Geofence Rules"
                description="Create your first geofence rule to control access"
                icon={<Shield className="mx-auto text-muted-foreground mb-4 dark:text-gray-500" size={48}/>} 
                className="border-none shadow-none"
              />
            )}

            {rTotalPages > 1 && (
              <div className="p-4 border-t border-panel-border flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Page {rPage} of {rTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={rPage === 1}
                    onClick={() => setRPage(p => p - 1)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 dark:text-gray-300" />
                  </button>
                  <button
                    disabled={rPage === rTotalPages}
                    onClick={() => setRPage(p => p + 1)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'sanctions' && (
        <div className="space-y-6">
          {/* Sanctions Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <SummaryCard
              title="Total Sanctioned"
              value={sanctionsTotal}
              mainColor="orange"
              icon={ICONS.AlertTriangle}
              // bottomLabel="Active customers"
            />
            <SummaryCard
              title="Comprehensive"
              value={sanctionsStats.comprehensive}
              mainColor="red"
              icon={ICONS.XCircle}
              // trend="+3"
              // trendColor="yellow"
              // bottomLabel="Awaiting verification"
            />
            <SummaryCard
              title="Partial Sanctions"
              value={sanctionsStats.partial}
              mainColor="yellow"
              icon={ICONS.AlertTriangle}
              // bottomLabel="Verified customers"
            />
            <SummaryCard
              title="Data Sources"
              value={sanctionsSources.length}
              mainColor="blue"
              icon={ICONS.Shield}
              // bottomLabel="Enhanced due diligence"
            />
          </div>



          {/* Sanctions List */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sanctioned Countries</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredSanctions.length} of {sanctionsTotal} countries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sanctionsSources.map(source => (
                    <div key={source} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        source === 'OFAC' ? 'bg-red-500' : source === 'EU' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{source}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({sanctionsStats.bySource[source] || 0})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {filteredSanctions.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredSanctions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSanction(s)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          s.sanction_level === 'comprehensive'
                            ? 'bg-red-100 dark:bg-red-900/40'
                            : s.sanction_level === 'partial'
                            ? 'bg-orange-100 dark:bg-orange-900/40'
                            : 'bg-yellow-100 dark:bg-yellow-900/40'
                        }`}>
                          <Globe className={`w-5 h-5 ${
                            s.sanction_level === 'comprehensive'
                              ? 'text-red-600 dark:text-red-400'
                              : s.sanction_level === 'partial'
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.country_name}</h3>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{s.country_iso}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge color={s.sanction_level === 'comprehensive' ? 'red' : s.sanction_level === 'partial' ? 'orange' : 'yellow'}>
                              {s.sanction_level}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {s.description || 'General sanctions'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {s.sanction_source && (
                            <div
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                s.sanction_source === 'OFAC'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : s.sanction_source === 'EU'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}
                            >
                              {s.sanction_source}
                            </div>
                          )}
                        </div>
                        {!isSystemUser && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSanction(s); setShowSanctionForm(true); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                              title="Edit sanction"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteSanctionConfirm({ show: true, sanction: s }); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete sanction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyResult
                title="No Sanctioned Countries Found"
                description={sanctionLevelFilter.length > 0 || sanctionSourceFilter.length > 0 || globalSearch
                  ? "Try adjusting your filters or search terms"
                  : "Sanctions data will appear here"}
                icon={<AlertTriangle className="mx-auto text-muted-foreground mb-4 dark:text-gray-500" size={48}/>}
                className="border-none shadow-none"
              />
            )}
          </section>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={!!selectedJurisdiction}
        onClose={() => setSelectedJurisdiction(null)}
        title="Jurisdiction Details"
      >
        {selectedJurisdiction && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedJurisdiction.country_name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">ISO: {selectedJurisdiction.country_iso}</span>
              </div>
              <ComplianceBadge status={selectedJurisdiction.status} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                {selectedJurisdiction.notes || 'No notes'}
              </span>
              <span className={`capitalize ${getRiskBadgeClasses(selectedJurisdiction.risk_level)}`}>
                Risk: {selectedJurisdiction.risk_level}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Applied Rules</h4>
              <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Rule Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {buildJurisdictionRules(selectedJurisdiction).map(r => (
                      <tr key={r.key}>
                        <td className="px-4 py-3 font-medium dark:text-gray-200">{r.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.type}</td>
                        <td className="px-4 py-3">
                          <Badge color={r.value ? 'green' : 'gray'}>{r.value ? "Enabled" : "Disabled"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t dark:border-slate-700">
              <button
                onClick={() => setSelectedJurisdiction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <GeofenceRuleFormModal
        isOpen={showRuleForm}
        onClose={() => { setShowRuleForm(false); setEditingRule(null); }}
        rule={editingRule}
        onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
        isLoading={isCreating || isUpdating}
      />

      <JurisdictionEditModal
        isOpen={!!editingJurisdiction}
        onClose={() => setEditingJurisdiction(null)}
        jurisdiction={editingJurisdiction}
        onSubmit={handleUpdateJurisdiction}
        isLoading={isUpdatingJurisdiction}
      />

      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, rule: null })}
        onConfirm={handleDeleteRule}
        title="Delete Geofence Rule"
        message={`Are you sure you want to delete "${deleteConfirm.rule?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        isLoading={isDeleting}
      />

      <TestRuleModal
        isOpen={!!testingRule}
        onClose={() => { setTestingRule(null); setTestResult(null); }}
        rule={testingRule}
        onTest={handleTestRule}
        isLoading={isTesting}
        testResult={testResult}
      />

      <JurisdictionFormModal
        isOpen={showJurisdictionForm}
        onClose={() => setShowJurisdictionForm(false)}
        onSubmit={handleCreateJurisdiction}
        isLoading={isCreatingJurisdiction}
        existingJurisdictions={jurisdictions}
      />

      <ConfirmModal
        isOpen={deleteJurisdictionConfirm.show}
        onClose={() => setDeleteJurisdictionConfirm({ show: false, jurisdiction: null })}
        onConfirm={handleDeleteJurisdiction}
        title="Delete Jurisdiction"
        message={`Are you sure you want to delete the jurisdiction configuration for "${deleteJurisdictionConfirm.jurisdiction?.country_name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        isLoading={isDeletingJurisdiction}
      />

      <SanctionFormModal
        isOpen={showSanctionForm}
        onClose={() => { setShowSanctionForm(false); setEditingSanction(null); }}
        sanction={editingSanction}
        onSubmit={editingSanction ? handleUpdateSanction : handleCreateSanction}
        isLoading={isCreatingSanction || isUpdatingSanction}
      />

      <ConfirmModal
        isOpen={deleteSanctionConfirm.show}
        onClose={() => setDeleteSanctionConfirm({ show: false, sanction: null })}
        onConfirm={handleDeleteSanction}
        title="Delete Sanction"
        message={`Are you sure you want to delete the sanction for "${deleteSanctionConfirm.sanction?.country_name}" (${deleteSanctionConfirm.sanction?.sanction_source})? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        isLoading={isDeletingSanction}
      />

      {/* Screen Country Modal */}
      <Modal
        isOpen={showScreenCountryModal}
        onClose={() => { setShowScreenCountryModal(false); setScreeningResult(null); }}
        title="Screen Country for Sanctions"
        subtitle="Check if a country is under any sanctions"
        icon={Search}
        iconColor="blue"
        size="md"
      >
        <div className="space-y-6">
          <FormSection title="Country Selection" description="Select a country to screen" icon={Globe}>
            <FormSelect
              label="Country"
              required
              onChange={(e) => {
                if (e.target.value) {
                  handleScreenCountry(e.target.value);
                }
              }}
              options={[
                { value: '', label: 'Select a country...' },
                ...COUNTRIES.map(c => ({ value: c.iso, label: `${c.name} (${c.iso})` }))
              ]}
            />
          </FormSection>

          {isScreening && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {screeningResult && !isScreening && (
            <div className="space-y-4">
              <div className={`p-5 rounded-xl border-2 ${
                screeningResult.is_sanctioned
                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-700'
                  : 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-300 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-700'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    screeningResult.is_sanctioned
                      ? 'bg-red-100 dark:bg-red-900/40'
                      : 'bg-emerald-100 dark:bg-emerald-900/40'
                  }`}>
                    {screeningResult.is_sanctioned ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className={`text-lg font-bold ${
                      screeningResult.is_sanctioned
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {screeningResult.is_sanctioned ? 'SANCTIONED' : 'NOT SANCTIONED'}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {screeningResult.country_name} ({screeningResult.country_iso})
                    </p>
                  </div>
                </div>

                {screeningResult.is_sanctioned && (
                  <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700/50 space-y-3">
                    {screeningResult.sanction_level && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Level:</span>
                        <Badge color={screeningResult.sanction_level === 'comprehensive' ? 'red' : 'orange'}>
                          {screeningResult.sanction_level}
                        </Badge>
                      </div>
                    )}
                    {screeningResult.sanction_sources?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sources:</span>
                        <div className="flex gap-1.5">
                          {screeningResult.sanction_sources.map((src: string) => (
                            <Badge key={src} color="gray">{src}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {screeningResult.programs?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Programs:</span>
                        <ul className="mt-1 list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                          {screeningResult.programs.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {screeningResult.recommendations?.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Recommendations:</p>
                        <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                          {screeningResult.recommendations.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => { setShowScreenCountryModal(false); setScreeningResult(null); }}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sanction Detail Modal */}
      <Modal
        isOpen={!!selectedSanction}
        onClose={() => setSelectedSanction(null)}
        title={selectedSanction?.country_name || 'Sanction Details'}
        subtitle="View detailed sanction information"
        icon={AlertTriangle}
        iconColor="orange"
        size="md"
      >
        {selectedSanction && (
          <div className="space-y-6">
            {/* Country Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-xl">
              <div className={`p-3 rounded-xl ${
                selectedSanction.sanction_level === 'comprehensive'
                  ? 'bg-red-100 dark:bg-red-900/40'
                  : 'bg-orange-100 dark:bg-orange-900/40'
              }`}>
                <Globe className={`w-6 h-6 ${
                  selectedSanction.sanction_level === 'comprehensive'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedSanction.country_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ISO Code: {selectedSanction.country_iso}</div>
              </div>
              <Badge color={selectedSanction.sanction_level === 'comprehensive' ? 'red' : selectedSanction.sanction_level === 'partial' ? 'orange' : 'yellow'}>
                {selectedSanction.sanction_level}
              </Badge>
            </div>

            {/* Sanction Source */}
            <FormSection title="Sanction Source" description="Organization enforcing sanctions" icon={Shield}>
              <div className="flex flex-wrap gap-2">
                {selectedSanction.sanction_source && (
                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
                      selectedSanction.sanction_source === 'OFAC'
                        ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : selectedSanction.sanction_source === 'EU'
                        ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      selectedSanction.sanction_source === 'OFAC' ? 'bg-red-500' : selectedSanction.sanction_source === 'EU' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className={`font-medium ${
                      selectedSanction.sanction_source === 'OFAC'
                        ? 'text-red-700 dark:text-red-400'
                        : selectedSanction.sanction_source === 'EU'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {selectedSanction.sanction_source === 'OFAC' ? 'U.S. Treasury OFAC' : selectedSanction.sanction_source === 'EU' ? 'European Union' : selectedSanction.sanction_source === 'UN' ? 'United Nations' : selectedSanction.sanction_source}
                    </span>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Description */}
            {selectedSanction.description && (
              <FormSection title="Description" description="Sanction details" icon={FileText}>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedSanction.description}</p>
                </div>
              </FormSection>
            )}

            {/* Programs */}
            {selectedSanction.programs && (
              <FormSection title="Sanction Programs" description="Active sanction programs" icon={FileText}>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <ul className="space-y-2">
                    {(() => {
                      try {
                        const programs = JSON.parse(selectedSanction.programs);
                        return Array.isArray(programs) ? programs.map((program: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            {program}
                          </li>
                        )) : (
                          <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            {selectedSanction.programs}
                          </li>
                        );
                      } catch {
                        return (
                          <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            {selectedSanction.programs}
                          </li>
                        );
                      }
                    })()}
                  </ul>
                </div>
              </FormSection>
            )}

            {/* Compliance Implications */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-300">Compliance Implications</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {selectedSanction.sanction_level === 'comprehensive'
                      ? 'This country is under comprehensive sanctions. All transactions and dealings are prohibited unless specifically licensed.'
                      : selectedSanction.sanction_level === 'partial'
                      ? 'This country is under partial sanctions. Some transactions may be restricted. Review specific programs for details.'
                      : 'This country is under sectoral sanctions. Specific industries or activities may be restricted.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedSanction(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
