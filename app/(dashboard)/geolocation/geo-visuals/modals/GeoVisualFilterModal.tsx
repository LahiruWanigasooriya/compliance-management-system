"use client";
import DialogModal from "@/components/common/dialog-modal/DialogModal";
import DropDown from "@/components/common/dropdown/DropDown";
import { MultiSelectSearchableDropdown } from "@/components/common/dropdown/MultiSelectSearchableDropdown";
import { Button } from "@/components/ui/button";
import { FilterProps } from "@/types/common.types";
import { useEffect, useState } from "react";

interface GeoLocationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    anonymizerTypes: string[];
    identifierTypes: string[];
    timeFrame?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  currentFilters?: FilterProps[];
}

const GeoVisualFilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: GeoLocationFilterModalProps) => {
  const getCurrentValue = (type: string) => {
    const filter = currentFilters?.find((f) => f.type === type);
    if (type === 'anonymizer' || type === 'identifier') return filter?.value as string[] || [];
    if (type === 'dateRange') {
      const dateValue = filter?.value as string;
      if (dateValue) {
        const [from, to] = dateValue.split(':');
        return { from, to };
      }
      return { from: "", to: "" };
    }
    return filter?.value ?? "";
  };

  const [anonymizerTypes, setAnonymizerTypes] = useState<string[]>(
    (getCurrentValue('anonymizer') as string[]) || []
  );
  const [identifierTypes, setIdentifierTypes] = useState<string[]>(
    (getCurrentValue('identifier') as string[]) || []
  );
  const [timeFrame, setTimeFrame] = useState<string>(
    (getCurrentValue('timeFrame') as string) || ""
  );
  const [dateFrom, setDateFrom] = useState<string>((getCurrentValue('dateRange') as { from: string; to: string })?.from || "");
  const [dateTo, setDateTo] = useState<string>((getCurrentValue('dateRange') as { from: string; to: string })?.to || "");
  const [errors, setErrors] = useState<{
    dateFrom?: string;
    dateTo?: string;
  }>({});
  
  useEffect(() => {
    if (!isOpen) return;

    const anonymizers = getCurrentValue("anonymizer") as string[];
    const identifiers = getCurrentValue("identifier") as string[];
    const timeFrameValue = getCurrentValue("timeFrame") as string;
    const dateRange = getCurrentValue("dateRange") as { from: string; to: string };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnonymizerTypes(anonymizers || []);
    setIdentifierTypes(identifiers || []);

    if (dateRange?.from && dateRange?.to) {
      setTimeFrame("other");
      setDateFrom(dateRange.from);
      setDateTo(dateRange.to);
    } else {
      setTimeFrame(timeFrameValue || "");
      setDateFrom("");
      setDateTo("");
    }

    setErrors({});
  }, [isOpen, currentFilters]);

  const anonymizers = [
    {id: "1", label: "VPN", value: "vpn"},
    {id: "2", label: "Proxy", value: "proxy"},
    {id: "3", label: "TOR", value: "tor"},
  ]
  const identifiers = [
    {id: "1", label: "Device UUID", value: "device_uuid"},
    {id: "2", label: "Customer ID", value: "cus_id"},
    {id: "3", label: "Address", value: "address"},
  ]
  const timeFrames = [
    { id: "1", label: "Last 24 Hours", value: "24h" },
    { id: "2", label: "Last 7 Days", value: "7d" },
    { id: "3", label: "Last 30 Days", value: "30d" },
    { id: "4", label: "Other", value: "other"},
  ];

  const handleClearFilters = () => {
    setAnonymizerTypes([]);
    setIdentifierTypes([]);
    setTimeFrame("");
    setDateFrom("");
    setDateTo("");
  };

  const handleApplyFilters = () => {
    const newErrors: typeof errors = {};

    if (timeFrame === "other") {
        if (!dateFrom) newErrors.dateFrom = "Date From is required";
        if (!dateTo) newErrors.dateTo = "Date To is required";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    setErrors({});

    const filters: any = {
      anonymizerTypes,
      identifierTypes,
    };
    
    if (timeFrame === "other") {
        filters.dateFrom = dateFrom;
        filters.dateTo = dateTo;
    } else {
        filters.timeFrame = timeFrame;
    }

    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  };

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-card"
      title="Geo Visualization Filters"
    >
      <div className="flex flex-col gap-8 text-primary-foreground">
        <div className="flex flex-col gap-4">
            <MultiSelectSearchableDropdown
                options={anonymizers}
                value={anonymizerTypes}
                onChange={setAnonymizerTypes}
                getOptionLabel={(type) => type.label}
                getOptionValue={(type) => type.value}
                placeholder="Select Anonymizer Types"
                searchPlaceholder="Search anonymizer types..."
                label="Anonymizer Types"
                buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
                labelClassName=""
                className="flex flex-col gap-2"
            />
            <MultiSelectSearchableDropdown
                disabled={true}
                options={identifiers}
                value={identifierTypes}
                onChange={setIdentifierTypes}
                getOptionLabel={(i) => i.label}
                getOptionValue={(i) => i.value}
                placeholder="Select Identifiers"
                searchPlaceholder="Search identifiers..."
                label="Identifiers"
                buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
                labelClassName=""
                className="flex flex-col gap-2"
            />
            <DropDown
                label="Time Frame"
                value={timeFrame}
                selectOptions={timeFrames}
                getOptionKey={(t) => t.id}
                getOptionValue={(t) => t.value}
                getOptionLabel={(t) => t.label}
                onChange={setTimeFrame}
                placeholderValue="Select Time Frame"
            />
            {timeFrame === "other" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label>
                            Date From
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value)
                                setErrors((prev) => ({ ...prev, dateFrom: undefined }));
                            }}
                            className="h-12 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.dateFrom && (
                            <span className="text-xs text-red-500">{errors.dateFrom}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label>
                            Date To
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value)
                                setErrors((prev) => ({ ...prev, dateTo: undefined }));
                            }}
                            className="h-12 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.dateTo && (
                            <span className="text-xs text-red-500">{errors.dateTo}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
        <div className="w-full flex justify-between gap-4">
            <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-14 flex-1 rounded-[40px] px-6 py-4 text-center bg-card text-[#0f7ec4] hover:text-[#2074a8]  cursor-pointer text-base shadow-sm hover:shadow-md transition-all"
            >
                Clear Filters
            </Button>
            <Button
                onClick={handleApplyFilters}
                className="h-14 flex-1 rounded-[40px] text-white bg-[#1A5276] px-6 py-4 hover:bg-[#143F5C] cursor-pointer text-base shadow-sm hover:shadow-md transition-all"
            >
                Apply Filters
            </Button>
        </div>
      </div>
    </DialogModal>
  );
};

export default GeoVisualFilterModal;
