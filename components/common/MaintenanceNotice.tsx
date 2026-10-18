import React from "react";
import { OctagonAlert } from "lucide-react";

interface MaintenanceNoticeProps {
  message?: string;
}

const MaintenanceNotice = ({ message = "Still under maintenance" }: MaintenanceNoticeProps) => {
  return (
    <div className=" flex flex-col items-center gap-4 ">
      <OctagonAlert className="  text-[#0A6650] dark:text-amber-400 lg:w-[100px] lg:h-[100px] w-[50px] h-[50px]"  />
      <span className="lg:text-[28px] font-medium text-center text-[20px] ">{message}</span>
    </div>
  );
};

export default MaintenanceNotice;