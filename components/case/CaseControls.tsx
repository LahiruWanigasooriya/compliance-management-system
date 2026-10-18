'use client';

import { ICONS } from '@/constants/constants';
import { Select } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SavedFilterManager from '@/components/common/SavedFilterManager';
import { getStatusOptionLabel } from '@/utils/statusHelpers';
import {
  Case,
  CaseCategory,
  CasePriority,
  CaseStatus,
} from '@/types/cases.types';

const CASE_STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const CASE_CATEGORY_OPTIONS: { value: CaseCategory; label: string }[] = [
  { value: 'kyc', label: 'KYC' },
  { value: 'aml', label: 'AML' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other' },
];

const CASE_PRIORITY_OPTIONS: { value: CasePriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface CaseControlsProps {
  cases: Case[];
}

// Format date to RFC3339 without milliseconds (Go's time.RFC3339 format)
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

export const CaseControls = ({ cases }: CaseControlsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    searchParams.get('status') ? [searchParams.get('status')!] : [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string[]>(
    searchParams.get('category') ? [searchParams.get('category')!] : [],
  );
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>(
    searchParams.get('risk_level') ? [searchParams.get('risk_level')!] : [],
  );
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [savedFilterClearSignal, setSavedFilterClearSignal] = useState(0);
  const [isClearingFilters, setIsClearingFilters] = useState(false);
  const [allOfficers, setAllOfficers] = useState<
    Array<{ userId: string; fullName: string }>
  >([]);

  const priority = searchParams.get('priority') || '';
  const assignedFor = searchParams.get('assigned_for') || '';

  const assignedOptions = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((c) => {
      if (!c.assigned_for) return;
      const label = c.assigned_user?.full_name || c.assigned_for;
      if (!map.has(c.assigned_for)) {
        map.set(c.assigned_for, label);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [cases]);
  const sortField = searchParams.get('sort') || '';
  const sortOrder = searchParams.get('order_by') || 'DESC';

  const filterState = {
    searchTerm,
    selectedStatus,
    selectedCategory,
    selectedRiskLevel,
  };

  const filterSetters = {
    setSearchTerm,
    setSelectedStatus,
    setSelectedCategory,
    setSelectedRiskLevel,
  };

  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const newUrl = `/cases?${params.toString()}`;
      router.push(newUrl);
      setTimeout(() => router.refresh(), 0);
    },
    [searchParams, router],
  );

  // Skip initial mount
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  }, [isInitialMount]);

  // Accumulate all officers from cases (so filtering doesn't reduce the dropdown options)
  useEffect(() => {
    if (cases && cases.length > 0) {
      setAllOfficers((prevOfficers) => {
        const newOfficers = [...prevOfficers];
        cases.forEach((c) => {
          if (
            c?.assigned_for &&
            !newOfficers.some((o) => o.userId === c.assigned_for)
          ) {
            newOfficers.push({
              userId: c.assigned_for,
              fullName: c.assigned_user?.full_name || c.assigned_for,
            });
          }
        });
        // Only update if we found new officers
        if (newOfficers.length !== prevOfficers.length) {
          return newOfficers;
        }
        return prevOfficers;
      });
    }
  }, [cases]);

  // Sync status, category, and risk_level to URL
  useEffect(() => {
    if (isInitialMount || isClearingFilters) return;

    const params = new URLSearchParams(searchParams.toString());

    if (selectedStatus.length > 0) {
      params.set('status', selectedStatus[0]);
    } else {
      params.delete('status');
    }

    if (selectedCategory.length > 0) {
      params.set('category', selectedCategory[0]);
    } else {
      params.delete('category');
    }

    if (selectedRiskLevel.length > 0) {
      params.set('risk_level', selectedRiskLevel[0]);
    } else {
      params.delete('risk_level');
    }

    params.set('page', '1');

    const newUrl = `/cases?${params.toString()}`;
    router.push(newUrl);
    setTimeout(() => router.refresh(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCategory, selectedRiskLevel]);

  // Debounced search effect
  useEffect(() => {
    if (isInitialMount || isClearingFilters) return;

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      params.set('page', '1');

      const newUrl = `/cases?${params.toString()}`;
      router.push(newUrl);
      setTimeout(() => router.refresh(), 0);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setSelectedStatus(value ? [value] : []);
    } else if (key === 'category') {
      setSelectedCategory(value ? [value] : []);
    } else if (key === 'risk_level') {
      setSelectedRiskLevel(value ? [value] : []);
    } else {
      updateURL({ [key]: value, page: '1' });
    }
  };

  const clearAllFilters = () => {
    setIsClearingFilters(true);
    setSearchTerm('');
    setSelectedStatus([]);
    setSelectedCategory([]);
    setSelectedRiskLevel([]);
    setSavedFilterClearSignal((prev) => prev + 1);
    router.push('/cases');
    setTimeout(() => {
      router.refresh();
      setIsClearingFilters(false);
    }, 0);
  };

  return (
    <>
      {/* Search and Filter Panel */}
      <div className="mb-4 space-y-3">
        {/* Search Bar and Filters Button */}
        <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <ICONS.Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-500"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Case ID, Customer Name, Account Number, Officer..."
                className="w-full bg-card border border-panel-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-ring"
              />
            </div>
            <Button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              variant="ghost"
              size="default"
              className="cursor-pointer flex items-center gap-2 px-4 py-5.25 border border-panel-border rounded-lg text-sm font-medium text-foreground bg-card hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ICONS.Filter size={16} />
              <span>Filters</span>
            </Button>

            {/* Sort Controls */}
            {/* <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => updateURL({ sort: e.target.value, page: '1' })}
                className="px-3 py-2 border border-panel-border rounded-lg bg-white dark:bg-slate-800 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sort by: Default</option>
                <option value="created_at">Created Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
                <option value="risk_category">Risk Level</option>
              </select>
              <button
                onClick={() =>
                  updateURL({
                    order_by: sortOrder === 'DESC' ? 'ASC' : 'DESC',
                    page: '1',
                  })
                }
                className="flex items-center gap-1 px-3 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-slate-800 shadow-sm cursor-pointer"
                title={sortOrder === 'DESC' ? 'Descending' : 'Ascending'}
              >
                {sortOrder === 'DESC' ? (
                  <ICONS.ChevronDown size={16} />
                ) : (
                  <ICONS.ChevronUp size={16} />
                )}
                <span className="hidden sm:inline">
                  {sortOrder === 'DESC' ? 'Desc' : 'Asc'}
                </span>
              </button>
            </div> */}
          </div>
          <SavedFilterManager
            className="mt-3 flex flex-wrap items-center gap-2"
            filterState={filterState}
            filterSetters={filterSetters}
            clearSignal={savedFilterClearSignal}
            filterType="cases"
          />
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={selectedStatus[0] || ''}
                  onChange={(value) => handleFilterChange('status', value ?? '')}
                  allowClear
                  placeholder="Status"
                  size="small"
                  className="w-full"
                >
                  <Select.Option value="">All Statuses</Select.Option>
                  {CASE_STATUS_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {getStatusOptionLabel(option.value, option.label)}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <Select
                  value={selectedCategory[0] || ''}
                  onChange={(value) =>
                    handleFilterChange('category', value ?? '')
                  }
                  allowClear
                  placeholder="Category"
                  size="small"
                  className="w-full"
                >
                  <Select.Option value="">All Categories</Select.Option>
                  {CASE_CATEGORY_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <Select
                  value={priority || ''}
                  onChange={(value) =>
                    handleFilterChange('priority', value ?? '')
                  }
                  allowClear
                  placeholder="Priority"
                  size="small"
                  className="w-full"
                >
                  <Select.Option value="">All Priorities</Select.Option>
                  {CASE_PRIORITY_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Officer Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assigned Officer
                </label>
                <Select
                  value={assignedFor || ''}
                  onChange={(value) =>
                    handleFilterChange('assigned_for', value ?? '')
                  }
                  allowClear
                  placeholder="Assigned Officer"
                  size="small"
                  className="w-full"
                >
                  <Select.Option value="">All Officers</Select.Option>
                  {allOfficers.map((officer) => (
                    <Select.Option key={officer.userId} value={officer.userId}>
                      {officer.fullName}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Risk Level Filter */}
              {/* <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Risk Level
                </label>
                <select
                  value={selectedRiskLevel[0] || ''}
                  onChange={(e) =>
                    handleFilterChange('risk_level', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div> */}
            </div>

            {/* Date Range Quick Filters */}
            <div className="mt-4 border-t border-panel-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                <ICONS.Calendar size={16} className="inline mr-1" />
                Quick Date Filters
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Last Hour', hours: 1 },
                  { label: 'Last 24 Hours', hours: 24 },
                  { label: 'Last 7 Days', days: 7 },
                  { label: 'Last 30 Days', days: 30 },
                  { label: 'Last 90 Days', days: 90 },
                ].map((preset) => {
                  const fromDate = searchParams.get('fromDate');
                  const toDate = searchParams.get('toDate');

                  const isActive = (() => {
                    if (!fromDate || !toDate) return false;
                    const from = new Date(fromDate);
                    const to = new Date(toDate);
                    const diffMs = to.getTime() - from.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    const diffDays = diffHours / 24;

                    if (preset.hours) {
                      return Math.abs(diffHours - preset.hours) < 0.1;
                    } else if (preset.days) {
                      return Math.abs(diffDays - preset.days) < 0.1;
                    }
                    return false;
                  })();

                  const handlePresetClick = () => {
                    const now = new Date();
                    const from = new Date(now);

                    if (preset.hours) {
                      from.setHours(from.getHours() - preset.hours);
                    } else if (preset.days) {
                      from.setDate(from.getDate() - preset.days);
                    }

                    updateURL({
                      fromDate: formatDateForAPI(from),
                      toDate: formatDateForAPI(now),
                      page: '1',
                    });
                  };

                  return (
                    <button
                      key={preset.label}
                      onClick={handlePresetClick}
                      className={`px-3 py-1.5 text-sm border rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1A5276] text-white border-primary'
                          : 'border-panel-border hover:bg-gray-100 dark:hover:bg-slate-700 text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                {(searchParams.get('fromDate') ||
                  searchParams.get('toDate')) && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(
                        searchParams.toString(),
                      );
                      params.delete('fromDate');
                      params.delete('toDate');
                      params.set('page', '1');
                      router.push(`/cases?${params.toString()}`);
                      setTimeout(() => router.refresh(), 0);
                    }}
                    className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
