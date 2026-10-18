"use client";
import { getUsers } from "@/actions/user.actions";
import DialogModal from "@/components/common/dialog-modal/DialogModal";
import DropDown from "@/components/common/dropdown/DropDown";
import { Button } from "@/components/ui/button";
import { ICONS } from "@/constants/constants";
import { AlertAction, GeoAlert, GeoAlertNotes } from "@/types/geolocation.types";
import { User } from "@/types/user.types";
import { useEffect, useState } from "react";

interface AlertPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: GeoAlert;
  mode: AlertAction;
  onAction?: (alertId: string, action: AlertAction, notes: GeoAlertNotes) => Promise<void>;
}

const AlertPopupModal = ({
  isOpen,
  onClose,
  alert,
  mode,
  onAction,
}: AlertPopupModalProps) => {
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigneesLoading, setIsAssigneesLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const RESOLUTION_OPTIONS = [
    { id: "threat", value: "confirmed_threat", label: "Confirmed Threat" },
    { id: "other", value: "other", label: "Other" },
  ];

  const loadUsers = async () => {
    setIsAssigneesLoading(true);
    const usersResponse = await getUsers({ limit: 100 });
    if (!usersResponse.success || !usersResponse.data) {
      setUsers([]);
    } else {
      setUsers(usersResponse.data);
    }
    setIsAssigneesLoading(false);
  }
  
  useEffect(() => {
    if(!isOpen) {
      setUsers([]);
      return;
    }
    let isMounted = true;
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [isOpen])

  const getModalConfig = () => {
    switch (mode) {
      case "escalate":
        return {
          title: "Escalate Alert",
          description:
            "Add a reason for escalating this alert and confirm the action.",
          icon: <ICONS.AlertTriangle />,
          actionText: "Escalate",
          loadingText: "Escalating...",
          buttonColor: "bg-[#1A5276] hover:bg-[#143F5C]",
          reasonRequired: true,
        };
      case "close":
        return {
          title: "Close Alert",
          description:
            "Add a reason for closing this alert and confirm the action.",
          icon: <ICONS.AlertTriangle />,
          actionText: "Close",
          loadingText: "Closing...",
          buttonColor: "bg-[#1A5276] hover:bg-[#143F5C]",
          reasonRequired: true,
        };
      case "resolve":
        return {
          title: "Resolve Alert",
          description:
            "Add a reason for resolving this alert and confirm the action.",
          icon: <ICONS.AlertTriangle />,
          actionText: "Resolve",
          loadingText: "Resolving...",
          buttonColor: "bg-[#1A5276] hover:bg-[#143F5C]",
          reasonRequired: true,
        };
      default:
        return {
          title: "Action",
          description: "",
          icon: <ICONS.AlertTriangle />,
          actionText: "Continue",
          loadingText: "Processing...",
          buttonColor: "bg-[#1A5276] hover:bg-[#143F5C]",
          reasonRequired: true,
        };
    }
  };
  const config = getModalConfig();

  const isReasonRequired = mode === "close" || (mode === "resolve" && resolution === "other") || mode === "escalate";

  const isFormValid = (!isReasonRequired || reason.trim()) && (mode !== "resolve" || resolution) && (mode !== "escalate" || assignee);

  const handleAction = async () => {
    if (!isFormValid) {
      setError("Please complete required fields");
      return;
    }

    if (!onAction) return;

    try {
      setIsLoading(true);
      setError("");
      await onAction(alert.id, mode, {
        reason: reason.trim(),
        resolution,
        assignee
      });
      onClose();
    } catch (err) {
      console.log(err);
      setError(`Failed to ${mode} alert. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    setResolution("");
    setAssignee("");
    setIsLoading(false);
    onClose();
  };

  return (
    <DialogModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center">
            <div className="w-13 h-13 rounded-full bg-card flex items-center justify-center">
              {config.icon}
            </div>
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-bold md:text-xl text-foreground">
                {config.title}
              </h2>
              {config.description && (
                <p className="text-sm md:text-base text-muted-foreground px-2">
                  {config.description}
                </p>
              )}
            </div>
          </div>
          {mode === "escalate" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="assignee" className="text-base">Assign to*</label>
              <DropDown
                value={isAssigneesLoading ? "loading": assignee}
                selectOptions={
                  isAssigneesLoading
                    ? [{ id: "loading", name: "Loading..." }] as User[]
                    : users
                }
                getOptionKey={(u) => u.id}
                getOptionValue={(u) => u.id}
                getOptionLabel={(u) => u.name}
                onChange={setAssignee}
                placeholderValue={isAssigneesLoading ? "Loading assignees" : "Select assignee"}
                disabled={isAssigneesLoading}
              />
            </div>
          )}
          {mode === "resolve" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="resolution" className="text-base text-foreground">Resolution*</label>
              <DropDown
                value={resolution}
                selectOptions={RESOLUTION_OPTIONS}
                getOptionKey={(o) => o.id}
                getOptionValue={(o) => o.value}
                getOptionLabel={(o) => o.label}
                onChange={setResolution}
                placeholderValue="Select resolution"
              />
            </div>
          )}
          {isReasonRequired && (
            <div className="flex flex-col gap-2">
              <label htmlFor="reason" className="text-base text-foreground">
                Reason*
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason"
                className="w-full h-22 md:h-30 p-3 text-sm border border-gray-300 rounded-md resize-none focus:border-[#1A5276] focus:outline-none focus:ring-1 focus:ring-[#1A5276]"
                maxLength={500}
              />
              <div className="flex justify-end">
                <span className="text-sm text-muted-foreground">
                  {reason.length}/500
                </span>
              </div>
            </div>
          )}
          {error && (
              <p className="body-2-regular text-red-500">{error}</p>
          )}
        </div>
        <div className="w-full flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-14 flex-1 rounded-[40px] px-6 py-4 text-center bg-card text-[#1A5276] hover:text-[#1A5276] hover:bg-gray-100 cursor-pointer text-base shadow-sm hover:shadow-md transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={isLoading || (!isFormValid)}
            className="h-14 flex-1 rounded-[40px] text-white bg-[#1A5276] px-6 py-4 hover:bg-[#143F5C] cursor-pointer text-base shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? config.loadingText : config.actionText}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
};

export default AlertPopupModal;
