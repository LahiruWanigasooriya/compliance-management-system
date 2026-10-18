"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Input, Modal, Select } from "antd";
import { toast } from "sonner";
import { ICONS } from "@/constants/constants";
import {
  createSavedFilter,
  getSavedFilters,
  updateSavedFilter,
  deleteSavedFilter,
} from "@/actions/filter.action";
import {
  CreateSavedFilterPayload,
  DEFAULT_FILTER_TYPE,
  FilterValue,
  SavedFilter,
  UpdateSavedFilterPayload,
} from "@/types/filter.types";

type FilterState = Partial<{
  searchTerm: string;
  selectedCategory: string[];
  selectedCountry: string[];
  selectedRiskLevel: string[];
  selectedStatus: string[];
  selectedReviewStatus: string[];
  selectedAssignedFor: string[];
  selectedTimeRange: string;
  customRange: [string, string];
}>;

type FilterSetters = Partial<{
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setSelectedCategory: Dispatch<SetStateAction<string[]>>;
  setSelectedCountry: Dispatch<SetStateAction<string[]>>;
  setSelectedRiskLevel: Dispatch<SetStateAction<string[]>>;
  setSelectedStatus: Dispatch<SetStateAction<string[]>>;
  setSelectedReviewStatus: Dispatch<SetStateAction<string[]>>;
  setSelectedAssignedFor: Dispatch<SetStateAction<string[]>>;
  setSelectedTimeRange: Dispatch<SetStateAction<string>>;
  setCustomRange: Dispatch<SetStateAction<[string, string]>>;
}>;

type SavedFilterManagerProps = {
  filterState: FilterState;
  filterSetters: FilterSetters;
  filterType?: string;
  clearSignal?: number;
  className?: string;
  selectPlaceholder?: string;
  saveButtonLabel?: string;
  onFilterApplied?: (filter: SavedFilter | null) => void;
};

type SavedFilterOption = SavedFilter & {
  safeId: string;
};

const createSafeId = (filter: SavedFilter, index: number) => {
  const baseName =
    filter.names.join("-") ||
    filter.type ||
    `filter-${index}-${filter.id ?? "default"}`;
  const normalized = baseName.replace(/\s+/g, "-").toLowerCase();
  return filter.id ?? `saved-${normalized}-${index}`;
};

const getDisplayLabel = (filter: SavedFilter) =>
  filter.names[0] || filter.type || "Saved Filter";

const toArrayValue = (value?: FilterValue["value"]) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }
  return [];
};

const toStringValue = (value?: FilterValue["value"]) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

export default function SavedFilterManager({
  filterState,
  filterSetters,
  filterType,
  clearSignal,
  className,
  selectPlaceholder = "Saved Filters",
  saveButtonLabel = "Save Filters",
  onFilterApplied,
}: SavedFilterManagerProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadSavedFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSavedFilters(filterType ?? DEFAULT_FILTER_TYPE);
      if (response.success && response.data) {
        setSavedFilters(response.data.filters ?? []);
      } else {
        toast.error(response.message ?? "Unable to load saved filters.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load saved filters. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  useEffect(() => {
    setSelectedFilterId(null);
  }, [clearSignal]);

  const options = useMemo<SavedFilterOption[]>(() => {
    return savedFilters.map((filter, index) => ({
      ...filter,
      safeId: createSafeId(filter, index),
    }));
  }, [savedFilters]);

  const buildFilterValues = useCallback((): FilterValue[] => {
    const values: FilterValue[] = [];
    const {
      selectedCategory = [],
      selectedCountry = [],
      selectedRiskLevel = [],
      selectedStatus = [],
      selectedReviewStatus = [],
      selectedAssignedFor = [],
      selectedTimeRange = "",
      customRange = ["", ""],
      searchTerm = "",
    } = filterState;

    if (searchTerm.trim()) {
      values.push({
        field: "search",
        operator: "contains",
        value: searchTerm.trim(),
      });
    }

    if (selectedCategory.length > 0) {
      values.push({
        field: "category",
        operator: "in",
        value: selectedCategory,
      });
    }

    if (selectedCountry.length > 0) {
      values.push({
        field: "jurisdiction",
        operator: "in",
        value: selectedCountry,
      });
    }

    if (selectedRiskLevel.length > 0) {
      values.push({
        field: "risk_level",
        operator: "in",
        value: selectedRiskLevel,
      });
    }

    if (selectedStatus.length > 0) {
      values.push({
        field: "status",
        operator: "in",
        value: selectedStatus,
      });
    }

    if (selectedReviewStatus.length > 0) {
      values.push({
        field: "review_status",
        operator: "in",
        value: selectedReviewStatus,
      });
    }

    if (selectedAssignedFor.length > 0) {
      values.push({
        field: "assigned_for",
        operator: "in",
        value: selectedAssignedFor,
      });
    }

    if (selectedTimeRange) {
      values.push({
        field: "time_filter",
        operator: "eq",
        value: selectedTimeRange,
      });
      if (selectedTimeRange === "custom" && customRange[0] && customRange[1]) {
        values.push({
          field: "start_date",
          operator: "eq",
          value: customRange[0],
        });
        values.push({
          field: "end_date",
          operator: "eq",
          value: customRange[1],
        });
      }
    }

    return values;
  }, [filterState]);

  const applySavedFilterValues = (values: FilterValue[]) => {
    // const { setSearchTerm, setSelectedCategory, setSelectedCountry } =
    //   filterSetters;
    // const {
    //   setSelectedRiskLevel,
    //   setSelectedStatus,
    //   setSelectedReviewStatus,
    //   setSelectedAssignedFor,
    //   setSelectedTimeRange,
    //   setCustomRange,
    // } = filterSetters;

    const findValue = (field: string) =>
      values.find((value) => value.field === field)?.value;

    if (filterSetters.setSearchTerm) {
      filterSetters.setSearchTerm(toStringValue(findValue("search")).trim());
    }
    if (filterSetters.setSelectedCategory) {
      filterSetters.setSelectedCategory(toArrayValue(findValue("category")));
    }
    if (filterSetters.setSelectedCountry) {
      filterSetters.setSelectedCountry(toArrayValue(findValue("jurisdiction")));
    }
    if (filterSetters.setSelectedRiskLevel) {
      filterSetters.setSelectedRiskLevel(toArrayValue(findValue("risk_level")));
    }
    if (filterSetters.setSelectedStatus) {
      filterSetters.setSelectedStatus(toArrayValue(findValue("status")));
    }
    if (filterSetters.setSelectedReviewStatus) {
      filterSetters.setSelectedReviewStatus(
        toArrayValue(findValue("review_status")),
      );
    }
    if (filterSetters.setSelectedAssignedFor) {
      filterSetters.setSelectedAssignedFor(
        toArrayValue(findValue("assigned_for")),
      );
    }

    const timeFilterValue = toStringValue(findValue("time_filter"));
    if (timeFilterValue) {
      if (filterSetters.setSelectedTimeRange) {
        filterSetters.setSelectedTimeRange(timeFilterValue);
      }
      if (timeFilterValue === "custom" && filterSetters.setCustomRange) {
        filterSetters.setCustomRange([
          toStringValue(findValue("start_date")),
          toStringValue(findValue("end_date")),
        ]);
      } else if (filterSetters.setCustomRange) {
        filterSetters.setCustomRange(["", ""]);
      }
    } else {
      if (filterSetters.setSelectedTimeRange) {
        filterSetters.setSelectedTimeRange("7d");
      }
      if (filterSetters.setCustomRange) {
        filterSetters.setCustomRange(["", ""]);
      }
    }
  };

  const handleSelectChange = (value?: string) => {
    if (!value) {
      setSelectedFilterId(null);
      onFilterApplied?.(null);
      return;
    }
    const selected = options.find((option) => option.safeId === value);
    if (!selected) {
      setSelectedFilterId(null);
      onFilterApplied?.(null);
      return;
    }
    setSelectedFilterId(value);
    applySavedFilterValues(selected.values);
    onFilterApplied?.(selected);
  };

  const handleSaveFilters = async () => {
    const values = buildFilterValues();
    const isCustomRangeIncomplete =
      filterState.selectedTimeRange === "custom" &&
      (!filterState.customRange?.[0] || !filterState.customRange?.[1]);
    if (isCustomRangeIncomplete) {
      toast.error("Please select both a start and end date for custom ranges.");
      return;
    }
    if (values.length === 0) {
      toast.error("Select at least one filter before saving.");
      return;
    }

    const trimmedName = newFilterName.trim();
    if (!trimmedName) {
      toast.error("Please name this filter before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateSavedFilterPayload = {
        type: filterType ?? DEFAULT_FILTER_TYPE,
        names: [trimmedName],
        values,
      };
      const response = await createSavedFilter(payload);
      if (response.success && response.data) {
        toast.success("Filter saved.");
        await loadSavedFilters();
        const latestOption = {
          ...response.data,
          safeId: createSafeId(response.data, savedFilters.length),
        };
        setSelectedFilterId(latestOption.safeId);
        onFilterApplied?.(response.data);
        setIsModalOpen(false);
        setNewFilterName("");
      } else {
        toast.error(response.message ?? "Unable to save filter.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save filter. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFilter = async () => {
    if (!selectedFilterId) return;

    const selectedFilter = options.find(
      (option) => option.safeId === selectedFilterId,
    );
    if (!selectedFilter?.id) return;

    const values = buildFilterValues();
    if (values.length === 0) {
      toast.error("Select at least one filter before updating.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: UpdateSavedFilterPayload = { values };
      const response = await updateSavedFilter(selectedFilter.id, payload);
      if (response.success) {
        toast.success("Filter updated.");
        await loadSavedFilters();
      } else {
        toast.error(response.message ?? "Unable to update filter.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update filter. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFilter = async () => {
    if (!selectedFilterId) return;

    const selectedFilter = options.find(
      (option) => option.safeId === selectedFilterId,
    );
    if (!selectedFilter?.id) return;

    setIsDeleting(true);
    try {
      const response = await deleteSavedFilter(selectedFilter.id);
      if (response.success) {
        toast.success("Filter deleted.");
        setSelectedFilterId(null);
        onFilterApplied?.(null);
        await loadSavedFilters();
      } else {
        toast.error(response.message ?? "Unable to delete filter.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete filter. Please try again.",
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const hasFilterChanged = useMemo(() => {
    if (!selectedFilterId) return false;

    const selectedFilter = options.find(
      (option) => option.safeId === selectedFilterId,
    );
    if (!selectedFilter) return false;

    const currentValues = buildFilterValues();
    const savedValues = selectedFilter.values;

    if (currentValues.length !== savedValues.length) return true;

    return currentValues.some((currentVal) => {
      const savedVal = savedValues.find((sv) => sv.field === currentVal.field);
      if (!savedVal) return true;
      return JSON.stringify(currentVal.value) !== JSON.stringify(savedVal.value);
    });
  }, [selectedFilterId, options, buildFilterValues]);

  return (
    <>
      <div className={className ?? "flex flex-wrap items-center gap-2"}>
        {selectedFilterId ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpdateFilter}
              disabled={isSaving || !hasFilterChanged}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-700/50"
            >
              <ICONS.Edit
                size={16}
                className="text-gray-600 dark:text-slate-200"
              />
              Update
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
            >
              <ICONS.Trash2
                size={16}
                className="text-red-600 dark:text-red-300"
              />
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            <ICONS.Save
              size={16}
              className="text-gray-600 dark:text-slate-200"
            />
            {saveButtonLabel}
          </button>
        )}
        <Select
          size="small"
          placeholder={selectPlaceholder}
          value={selectedFilterId ?? undefined}
          onChange={handleSelectChange}
          allowClear
          loading={isLoading}
          disabled={isLoading}
          style={{
            minWidth: 220,
            maxHeight: 38,
            backgroundColor: "transparent",
            borderColor: "var(--border)",
          }}
          className="max-w-full"
          notFoundContent={
            <span className="text-muted-foreground">No Data</span>
          }
        >
          {options.map((option) => (
            <Select.Option key={option.safeId} value={option.safeId}>
              {getDisplayLabel(option)}
            </Select.Option>
          ))}
        </Select>

        {!isLoading && options.length === 0 && (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            No saved filters yet
          </span>
        )}
      </div>

      <Modal
        title="Save Filter"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setNewFilterName("");
        }}
        footer={[
          // Cancel Button eka
          <button
            key="back"
            onClick={() => setIsModalOpen(false)}
            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            Cancel
          </button>,
          // Custom Save Button eka
          <button
            key="submit"
            onClick={handleSaveFilters}
            disabled={isSaving}
            className="inline-flex cursor-pointer ml-2 items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#1A5276] text-white hover:bg-[#001F3F] dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648]"
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
          </button>,
        ]}
        destroyOnHidden
      >
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Save the current filter selections for later use.
        </p>
        <div className="mt-4">
          <input
            type="text"
            value={newFilterName}
            onChange={(event) => setNewFilterName(event.target.value)}
            placeholder="Filter name"
            maxLength={64}
            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-900 
               placeholder:text-gray-400 outline-none transition-all
               hover:border-gray-400 
               focus:border-gray-500 focus:ring-0
               dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 
               dark:hover:border-slate-500 dark:focus:border-slate-400"
          />
        </div>
      </Modal>

      <Modal
        title="Delete Filter"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={[
          <button
            key="cancel"
            onClick={() => setIsDeleteModalOpen(false)}
            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            Cancel
          </button>,
          <button
            key="delete"
            onClick={handleDeleteFilter}
            disabled={isDeleting}
            className="inline-flex cursor-pointer ml-2 items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>,
        ]}
        destroyOnHidden
      >
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Are you sure you want to delete this filter? This action cannot be
          undone.
        </p>
      </Modal>
    </>
  );
}
