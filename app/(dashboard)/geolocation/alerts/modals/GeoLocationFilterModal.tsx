"use client";
import { getUsers } from "@/actions/user.actions";
import DialogModal from "@/components/common/dialog-modal/DialogModal";
import DropDown from "@/components/common/dropdown/DropDown";
import { MultiSelectSearchableDropdown } from "@/components/common/dropdown/MultiSelectSearchableDropdown";
import { Button } from "@/components/ui/button";
import { FilterProps } from "@/types/common.types";
import { User } from "@/types/user.types";
import { useEffect, useMemo, useState } from "react";

interface GeoLocationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    alertAssignees: string[];
    alertAssigneeNames: string[];
    riskLevels: string[];
    alertStatuses: string[];
    jurisdictionTypes: string[];
    alertTimeFrame: string;
  }) => void;
  currentFilters?: FilterProps[];
}

const GeoLocationFilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: GeoLocationFilterModalProps) => {
  const getCurrentValue = (type: string) => {
    const filter = currentFilters?.find((f) => f.type === type);
    if (type === "alertAssignee" || type === "riskLevel" || type === "alertStatus" || type === "jurisdictionType") return filter?.value as string[] || [];
    return filter?.value ?? "";
  };
  const [alertAssignedUsers, setAlertAssignedUsers] = useState<User[]>([]);
  const [isAssigneesLoading, setIsAssigneesLoading] = useState(false);

  const [alertAssignees, setAlertAssignees] = useState<string[]>(
    (getCurrentValue("alertAssignee") as string[]) || []
  );
  const [riskLevels, setRiskLevels] = useState<string[]>(
    (getCurrentValue("riskLevel") as string[]) || []
  );
  const [alertStatuses, setAlertStatuses] = useState<string[]>(
    (getCurrentValue("alertStatus") as string[]) || []
  );
  const [jurisdictionTypes, setJurisdictionTypes] = useState<string[]>(
    (getCurrentValue("jurisdictionType") as string[]) || []
  );
  const [alertTimeFrame, setAlertTimeFrame] = useState<string>(
    (getCurrentValue("alertTimeFrame") as string) || ""
  );

  const selectedUserNames = useMemo(() => {
    if(!alertAssignees?.length) return [];

    return alertAssignedUsers
      .filter(user => alertAssignees.includes(user.id))
      .map(user => user.name);

  }, [alertAssignees, alertAssignedUsers]);

  const loadAssignees = async () => {
    setIsAssigneesLoading(true);
    const usersResponse = await getUsers({ limit: 100 });
    if (!usersResponse.success || !usersResponse.data) {
      setAlertAssignedUsers([]);
    } else {
      setAlertAssignedUsers(usersResponse.data);
    }
    setIsAssigneesLoading(false);
  }
  
  useEffect(() => {
    if(!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlertAssignedUsers([]);
      return;
    }
    let isMounted = true;
    loadAssignees();
    return () => {
      isMounted = false;
    };
  }, [isOpen])

  const riskLevelList = [
    { id: "1", label: "Low", value: "low" },
    { id: "2", label: "Medium", value: "medium" },
    { id: "3", label: "High", value: "high" },
    { id: "4", label: "Critical", value: "critical" },
  ];
  const jurisdictionTypeList = [
    { id: "1", label: "Allowed", value: "allowed" },
    { id: "2", label: "Restricted", value: "restricted" },
    { id: "3", label: "Blocked", value: "blocked" },
    { id: "4", label: "Sanctioned", value: "sanctioned" },
  ];
  const alertStatusList = [
    { id: "1", label: "Pending", value: "pending" },
    { id: "2", label: "In Progress", value: "in_progress" },
    { id: "3", label: "Closed", value: "closed" },
    { id: "4", label: "Resolved", value: "resolved" },
    { id: "5", label: "Escalated", value: "escalated" },
  ];

  const alertTimeFrames = [
    { id: "1", label: "Last Hour", value: "1h" },
    { id: "2", label: "Last 24 Hours", value: "24h" },
    { id: "3", label: "Last 7 Days", value: "7d" },
    { id: "4", label: "Last 30 Days", value: "30d" },
    { id: "5", label: "Last 90 Days", value: "90d" },
  ];

  const handleClearFilters = () => {
    setAlertAssignees([]);
    setRiskLevels([]);
    setAlertStatuses([]);
    setJurisdictionTypes([]);
    setAlertTimeFrame("");
  };

  const handleApplyFilters = () => {
    const filters: {
      alertAssignees: string[];
      alertAssigneeNames: string[];
      riskLevels: string[];
      alertStatuses: string[];
      jurisdictionTypes: string[];
      alertTimeFrame: string;
    } = {
      alertAssignees,
      alertAssigneeNames: selectedUserNames,
      riskLevels,
      alertStatuses,
      jurisdictionTypes,
      alertTimeFrame,
    };

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
      title="Geo Location Filters"
    >
      <div className="flex flex-col gap-8 text-primary-foreground">
        <div className="flex flex-col gap-4">
          <MultiSelectSearchableDropdown
            options={alertAssignedUsers}
            value={isAssigneesLoading ? ["loading"] : alertAssignees}
            onChange={setAlertAssignees}
            getOptionLabel={(a) => a.name}
            getOptionValue={(a) => a.id}
            placeholder={isAssigneesLoading ? "Loading Alert Assignees..." : "Select Alert Assignees"}
            searchPlaceholder="Search alert assignees..."
            label="Alert Assignee"
            buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
            labelClassName=""
            className="flex flex-col gap-2"
          />
          
          <MultiSelectSearchableDropdown
            options={riskLevelList}
            value={riskLevels}
            onChange={setRiskLevels}
            getOptionLabel={(a) => a.label}
            getOptionValue={(a) => a.value}
            placeholder="Select Risk Levels"
            searchPlaceholder="Search risk levels..."
            label="Risk Level"
            buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
            labelClassName=""
            className="flex flex-col gap-2"
          />

          <MultiSelectSearchableDropdown
            options={alertStatusList}
            value={alertStatuses}
            onChange={setAlertStatuses}
            getOptionLabel={(a) => a.label}
            getOptionValue={(a) => a.value}
            placeholder="Select Alert Statuses"
            searchPlaceholder="Search alert statuses..."
            label="Alert Status"
            buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
            labelClassName=""
            className="flex flex-col gap-2"
          />
          
          <MultiSelectSearchableDropdown
            options={jurisdictionTypeList}
            value={jurisdictionTypes}
            onChange={setJurisdictionTypes}
            getOptionLabel={(a) => a.label}
            getOptionValue={(a) => a.value}
            placeholder="Select Jurisdiction Types"
            searchPlaceholder="Search jurisdiction types..."
            label="Jurisdiction Type"
            buttonClassName="h-12 cursor-pointer bg-card text-sm border-gray-300!"
            dropdownClassName="max-h-30!"
            labelClassName=""
            className="flex flex-col gap-2"
          />

          <DropDown
            label="Alert Time Frame"
            value={alertTimeFrame}
            selectOptions={alertTimeFrames}
            getOptionKey={(t) => t.id}
            getOptionValue={(t) => t.value}
            getOptionLabel={(t) => t.label}
            onChange={setAlertTimeFrame}
            placeholderValue="Select Alert Time Frame"
          />
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

export default GeoLocationFilterModal;
