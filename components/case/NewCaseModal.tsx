'use client';

import { useState, useEffect } from 'react';
import { CreateCasePayload } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import {
  getRiskDashboardProfiles,
  RiskDashboardProfile,
  getComplianceOfficers,
  ComplianceOfficer,
} from '@/actions/cases.actions';
import { SearchableDropdown } from '@/components/common/dropdown/SearchableDropdown';
import { MultiSelectSearchableDropdown } from '@/components/common/dropdown/MultiSelectSearchableDropdown';
import { toast } from 'sonner';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCasePayload) => void;
  userId: string;
}

export const NewCaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
}: NewCaseModalProps) => {
  const [formData, setFormData] = useState<CreateCasePayload>({
    user_id: '',
    assigned_for: '',
    spectator: [],
    category: 'kyc',
    priority: 'low',
    risk_category: 'low',
    title: '',
    description: '',
    // risk_score: 0,
  });

  const [riskProfiles, setRiskProfiles] = useState<RiskDashboardProfile[]>([]);
  const [complianceOfficers, setComplianceOfficers] = useState<
    ComplianceOfficer[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const [riskProfileResponse, officersResponse] = await Promise.all([
        getRiskDashboardProfiles(),
        getComplianceOfficers(),
      ]);

      if (riskProfileResponse.success) {
        setRiskProfiles(riskProfileResponse.data.profiles);
      }
      if (officersResponse.success) {
        setComplianceOfficers(officersResponse.data);
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      user_id: '',
      assigned_for: '',
      spectator: [],
      category: 'kyc',
      priority: 'low',
      risk_category: 'low',
      title: '',
      description: '',
      // risk_score: 0,
    });
  };

  const isFormValid =
    formData.title.trim() !== '' &&
    formData.user_id !== '' &&
    formData.assigned_for !== '' &&
    formData.description.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.user_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.assigned_for) {
      toast.error('Please select a compliance officer');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    onSubmit(formData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'risk_score' ? Number(value) : value,
    }));
  };

  const handleSpectatorChange = (spectatorIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      spectator: spectatorIds,
    }));
  };

  const handleUserSelect = (user: RiskDashboardProfile) => {
    setFormData((prev) => ({
      ...prev,
      user_id: user.customer_id,
    }));
  };

  const handleCustomerSearch = async (
    query: string,
  ): Promise<RiskDashboardProfile[]> => {
    const response = await getRiskDashboardProfiles({ search: query });
    if (response.success) {
      return response.data.profiles;
    }
    return [];
  };

  const handleAssignedToSelect = (officer: ComplianceOfficer) => {
    setFormData((prev) => ({
      ...prev,
      assigned_for: officer.id,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg p-6 max-w-2xl w-full overflow-y-auto mx-4 max-h-[90vh] border border-panel-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Create New Case
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ICONS.X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter case title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kyc">KYC</option>
                <option value="fraud">Fraud</option>
                <option value="geo">Geo</option>
                <option value="aml">AML</option>
                <option value="sar">SAR</option>
                <option value="ctr">CTR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Risk Category <span className="text-red-500">*</span>
            </label>
            <select
              name="risk_category"
              value={formData.risk_category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <SearchableDropdown
            options={riskProfiles}
            value={formData.user_id}
            onChange={handleUserSelect}
            getOptionLabel={(user) => user.full_name}
            getOptionValue={(user) => user.customer_id}
            placeholder="Select customer"
            searchPlaceholder="Search customers..."
            label="Customer"
            required
            onSearch={handleCustomerSearch}
          />

          <SearchableDropdown
            options={complianceOfficers}
            value={formData.assigned_for}
            onChange={handleAssignedToSelect}
            getOptionLabel={(officer) => officer.full_name}
            getOptionValue={(officer) => officer.id}
            placeholder="Select compliance officer"
            searchPlaceholder="Search officers..."
            label="Assigned To"
            required
          />

          <MultiSelectSearchableDropdown
            options={complianceOfficers}
            value={formData.spectator}
            onChange={handleSpectatorChange}
            getOptionLabel={(officer) => officer.full_name}
            getOptionValue={(officer) => officer.id}
            placeholder="Select spectators"
            searchPlaceholder="Search officers..."
            label="Spectators"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter case description"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              // disabled={!isFormValid}
              className="px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
