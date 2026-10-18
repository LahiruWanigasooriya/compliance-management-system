'use client';

import { ICONS } from '@/constants/constants';
import { useState, useEffect } from 'react';
import { RiskDashboardFilters } from '@/actions/cases.actions';
import SavedFilterManager from '@/components/common/SavedFilterManager';

interface CustomerRiskControlsProps {
  onFilterChange: (filters: RiskDashboardFilters) => void;
  loading?: boolean;
}

export const CustomerRiskControls = ({
  onFilterChange,
  loading = false,
}: CustomerRiskControlsProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>("");
  const [selectedKycStatus, setSelectedKycStatus] = useState<string>("");
  const [selectedPep, setSelectedPep] = useState<string>("");
  const [selectedSanctions, setSelectedSanctions] = useState<string>("");
  const [selectedEdd, setSelectedEdd] = useState<string>("");
  const [selectedSynthetic, setSelectedSynthetic] = useState<string>("");
  const [selectedSyntheticStatus, setSelectedSyntheticStatus] = useState<string>("");
  const [selectedLocationCompliance, setSelectedLocationCompliance] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("risk_score");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);

  const filterState = {
    searchTerm,
    selectedRiskLevel,
    selectedStatus,
  };

  const filterSetters = {
    setSearchTerm,
    setSelectedRiskLevel,
    setSelectedStatus,
  };

  // Sync filter state changes to parent
  useEffect(() => {
    onFilterChange({
      search: searchTerm || undefined,
      risk_category: selectedRiskLevel[0] || undefined,
      entity_type: selectedEntityType || undefined,
      status: selectedStatus[0] || undefined,
      date_preset: selectedDatePreset || undefined,
      kyc_status: selectedKycStatus || undefined,
      is_pep: selectedPep || undefined,
      has_sanctions: selectedSanctions || undefined,
      requires_edd: selectedEdd || undefined,
      is_synthetic: selectedSynthetic || undefined,
      synthetic_status: selectedSyntheticStatus || undefined,
      location_compliance: selectedLocationCompliance || undefined,
      sort_by: sortBy || undefined,
      sort_order: sortOrder || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedRiskLevel, selectedStatus]);

  const handleFilterChange = (key: string, value: string) => {
    // Update local state
    if (key === 'risk_category') setSelectedRiskLevel(value ? [value] : []);
    if (key === 'entity_type') setSelectedEntityType(value);
    if (key === 'status') setSelectedStatus(value ? [value] : []);
    if (key === 'date_preset') setSelectedDatePreset(value);
    if (key === 'kyc_status') setSelectedKycStatus(value);
    if (key === 'is_pep') setSelectedPep(value);
    if (key === 'has_sanctions') setSelectedSanctions(value);
    if (key === 'requires_edd') setSelectedEdd(value);
    if (key === 'is_synthetic') setSelectedSynthetic(value);
    if (key === 'synthetic_status') setSelectedSyntheticStatus(value);
    if (key === 'location_compliance') setSelectedLocationCompliance(value);
    if (key === 'location') setLocationSearch(value);
    if (key === 'sort_by') setSortBy(value);
    if (key === 'sort_order') setSortOrder(value);

    // Call backend filter
    onFilterChange({
      search: searchTerm || undefined,
      risk_category: key === 'risk_category' ? (value || undefined) : (selectedRiskLevel[0] || undefined),
      entity_type: key === 'entity_type' ? (value || undefined) : (selectedEntityType || undefined),
      status: key === 'status' ? (value || undefined) : (selectedStatus[0] || undefined),
      date_preset: key === 'date_preset' ? (value || undefined) : (selectedDatePreset || undefined),
      kyc_status: key === 'kyc_status' ? (value || undefined) : (selectedKycStatus || undefined),
      is_pep: key === 'is_pep' ? (value || undefined) : (selectedPep || undefined),
      has_sanctions: key === 'has_sanctions' ? (value || undefined) : (selectedSanctions || undefined),
      requires_edd: key === 'requires_edd' ? (value || undefined) : (selectedEdd || undefined),
      is_synthetic: key === 'is_synthetic' ? (value || undefined) : (selectedSynthetic || undefined),
      synthetic_status: key === 'synthetic_status' ? (value || undefined) : (selectedSyntheticStatus || undefined),
      location_compliance: key === 'location_compliance' ? (value || undefined) : (selectedLocationCompliance || undefined),
      location: key === 'location' ? (value || undefined) : (locationSearch || undefined),
      sort_by: key === 'sort_by' ? (value || undefined) : (sortBy || undefined),
      sort_order: key === 'sort_order' ? (value || undefined) : (sortOrder || undefined),
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRiskLevel([]);
    setSelectedEntityType("");
    setSelectedStatus([]);
    setSelectedDatePreset("");
    setSelectedKycStatus("");
    setSelectedPep("");
    setSelectedSanctions("");
    setSelectedEdd("");
    setSelectedSynthetic("");
    setSelectedSyntheticStatus("");
    setSelectedLocationCompliance("");
    setLocationSearch("");
    setSortBy("risk_score");
    setSortOrder("desc");
    setSavedFilterClearSignal((prev) => prev + 1);
    onFilterChange({ sort_by: "risk_score", sort_order: "desc" });
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedRiskLevel.length > 0 ||
    selectedEntityType !== "" ||
    selectedStatus.length > 0 ||
    selectedDatePreset !== "" ||
    selectedKycStatus !== "" ||
    selectedPep !== "" ||
    selectedSanctions !== "" ||
    selectedEdd !== "" ||
    selectedSynthetic !== "" ||
    selectedSyntheticStatus !== "" ||
    selectedLocationCompliance !== "" ||
    locationSearch !== "";

  return (
    <>
      {/* Search and Filter Panel */}
      <div className="mb-4 space-y-3">
        {/* Search Bar and Sorting */}
        <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <ICONS.Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by Customer ID, Name, or Account Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
              />
            </div>
            {/* Sorting Controls and Filters Button */}
            <div className="flex gap-2">
              <div className="min-w-[180px]">
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="risk_score">Sort by: Risk Score</option>
                  <option value="created_at">Sort by: Created Date</option>
                  <option value="last_recorded_activity">Sort by: Last Activity</option>
                  <option value="customer_id">Sort by: Customer ID</option>
                  <option value="full_name">Sort by: Name</option>
                </select>
              </div>
              <button
                onClick={() => handleFilterChange('sort_order', sortOrder === 'asc' ? 'desc' : 'asc')}
                disabled={loading}
                className="px-3 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <ICONS.ChevronUp size={18} />
                ) : (
                  <ICONS.ChevronDown size={18} />
                )}
              </button>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-slate-800 shadow-sm cursor-pointer"
              >
                <ICONS.Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
          </div>
          <SavedFilterManager
            className="mt-3 flex flex-wrap items-center gap-2"
            filterState={filterState}
            filterSetters={filterSetters}
            clearSignal={savedFilterClearSignal}
            filterType="customer-risk"
          />
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Risk Level Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Risk Level
                </label>
                <select
                  value={selectedRiskLevel[0] || ''}
                  onChange={(e) => handleFilterChange('risk_category', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Entity Type
                </label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Entity Types</option>
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                  <option value="joint_account">Joint Account</option>
                  <option value="minor">Minor (with guardian)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer Status
                </label>
                <select
                  value={selectedStatus[0] || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="dormant">Dormant</option>
                  <option value="deactive">Deactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Date Preset */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Activity Period
                </label>
                <select
                  value={selectedDatePreset}
                  onChange={(e) => handleFilterChange('date_preset', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Time</option>
                  <option value="last_hour">Last Hour</option>
                  <option value="last_24h">Last 24 Hours</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_90_days">Last 90 Days</option>
                </select>
              </div>

              {/* KYC Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  KYC Status
                </label>
                <select
                  value={selectedKycStatus}
                  onChange={(e) => handleFilterChange('kyc_status', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All KYC Status</option>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="under_review">Under Review</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* PEP Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  PEP Status
                </label>
                <select
                  value={selectedPep}
                  onChange={(e) => handleFilterChange('is_pep', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  <option value="true">PEP Only</option>
                  <option value="false">Non-PEP</option>
                </select>
              </div>

              {/* Sanctions Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sanctions
                </label>
                <select
                  value={selectedSanctions}
                  onChange={(e) => handleFilterChange('has_sanctions', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  <option value="true">Sanctioned Only</option>
                  <option value="false">Not Sanctioned</option>
                </select>
              </div>

              {/* EDD Required Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  EDD Required
                </label>
                <select
                  value={selectedEdd}
                  onChange={(e) => handleFilterChange('requires_edd', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  <option value="true">EDD Required</option>
                  <option value="false">No EDD Required</option>
                </select>
              </div>

              {/* Synthetic Identity Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Synthetic Identity
                </label>
                <select
                  value={selectedSynthetic}
                  onChange={(e) => handleFilterChange('is_synthetic', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  <option value="true">Flagged as Synthetic</option>
                  <option value="false">Not Flagged</option>
                </select>
              </div>

              {/* Synthetic Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Synthetic Status
                </label>
                <select
                  value={selectedSyntheticStatus}
                  onChange={(e) => handleFilterChange('synthetic_status', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Status</option>
                  <option value="not_checked">Not Checked</option>
                  <option value="flagged">Flagged</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cleared">Cleared</option>
                </select>
              </div>

              {/* Location Compliance Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location Compliance
                </label>
                <select
                  value={selectedLocationCompliance}
                  onChange={(e) => handleFilterChange('location_compliance', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Locations</option>
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              {/* Location Search Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location Search
                </label>
                <div className="relative">
                  <ICONS.MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search country, city, region..."
                    value={locationSearch}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 pl-9 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
