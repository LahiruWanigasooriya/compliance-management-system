import { getUsers } from "@/actions/user.actions";
import DialogModal from "@/components/common/dialog-modal/DialogModal";
import DropDown from "@/components/common/dropdown/DropDown";
import { Button } from "@/components/ui/button";
import { FilterProps } from "@/types/common.types";
import { User } from "@/types/user.types";
import { useEffect, useMemo, useState } from "react";

interface GeoAuditLogFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    severityType: string;
    resourceType: string;
    timeFrame: string;
    selectedUser: string;
    selectedUserName: string;
  }) => void;
  currentFilters?: FilterProps[];
}
const GeoAuditLogFilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: GeoAuditLogFilterModalProps) => {
  const getCurrentValueofFilters = (type: string) => {
    const filter = currentFilters?.find((f) => f.type === type);
    return filter?.value ?? "";
  };
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [severityType, setSeverityType] = useState<string>(
    (getCurrentValueofFilters("severityType") as string) || ""
  );
  const [resourceType, setResourceType] = useState<string>(
    (getCurrentValueofFilters("resourceType") as string) || ""
  )
  const [timeFrame, setTimeFrame] = useState<string>(
    (getCurrentValueofFilters("timeFrame") as string) || ""
  )
  const [selectedUser, setSelectedUser] = useState<string>(
    (getCurrentValueofFilters("selectedUser") as string) || ""
  );

  const severityTypes = [
    { id: "1", label: "Info", value: "info" },
    { id: "2", label: "Warning", value: "warning" },
    { id: "3", label: "High", value: "high" },
    { id: "4", label: "Critical", value: "critical" },
    { id: "5", label: "Error", value: "error" },
  ];

  const resourceTypes = [
    { id: "1", label: "Device", value: "device" },
    { id: "2", label: "Alert", value: "alert" },
    { id: "3", label: "Geo Location", value: "geolocation" },
    { id: "4", label: "Jurisdiction", value: "jurisdiction" },
  ];

  const timeFrames = [
    { id: "1", label: "Last Hour", value: "1h" },
    { id: "2", label: "Last 24 Hours", value: "24h" },
    { id: "3", label: "Last 7 Days", value: "7d" },
    { id: "4", label: "Last 30 Days", value: "30d" },
    { id: "5", label: "Last 90 Days", value: "90d" },
  ];

  const selectedPerformer = useMemo(() => {
    return users.find((u) => u.id === selectedUser);
  }, [users, selectedUser]);
  
  const loadAssignees = async () => {
    setIsUsersLoading(true);
    const usersResponse = await getUsers({ limit: 100 });
    if (!usersResponse.success || !usersResponse.data) {
      setUsers([]);
    } else {
      setUsers(usersResponse.data);
    }
    setIsUsersLoading(false);
  }

  const handleClearFilters = () => {
    setSeverityType("");
    setResourceType("");
    setTimeFrame("");
    setSelectedUser("");
  }

  const handleApplyFilters = () => {
    const filters: {
      severityType: string;
      resourceType: string;
      timeFrame: string;
      selectedUser: string;
      selectedUserName: string;
    } = {
      severityType,
      resourceType,
      timeFrame,
      selectedUser,
      selectedUserName: selectedPerformer?.name ?? "",
    };

    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  }

  useEffect(() => {
    if(!isOpen) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers([]);
    return;
    }
    let isMounted = true;
    loadAssignees();
    return () => {
    isMounted = false;
    };
  }, [isOpen])


  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-card"
      title="Geo Location Audit Log Filters"
    >
      <div className="flex flex-col gap-8 text-primary-foreground">
        <div className="flex flex-col gap-4">
          <DropDown
            label="Severity"
            value={severityType}
            selectOptions={severityTypes}
            getOptionKey={(s) => s.id}
            getOptionValue={(s) => s.value}
            getOptionLabel={(s) => s.label}
            onChange={setSeverityType}
            placeholderValue="Select Severity Type"
          />
          <DropDown
            label="Resource"
            value={resourceType}
            selectOptions={resourceTypes}
            getOptionKey={(r) => r.id}
            getOptionValue={(r) => r.value}
            getOptionLabel={(r) => r.label}
            onChange={setResourceType}
            placeholderValue="Select Resource Type"
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
          <DropDown
            label="Performed By"
            value={isUsersLoading ? "loading" : selectedUser}
            selectOptions={
              isUsersLoading
                ? [{ id: "loading", name: "Loading..." }] as User[]
                : users
            }
            getOptionKey={(u) => u.id}
            getOptionValue={(u) => u.id}
            getOptionLabel={(u) => u.name}
            onChange={setSelectedUser}
            placeholderValue={isUsersLoading ? "Loading Users..." : "Select Performed User"}
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
}

export default GeoAuditLogFilterModal
