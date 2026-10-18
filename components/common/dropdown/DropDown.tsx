 "use client"
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ICONS } from "@/constants/constants";

interface DropdownProps<T> {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholderValue?: string;
  selectOptions: T[];
  getOptionLabel: (option: T) => React.ReactNode | string;
  getOptionKey: (option: T) => string;
  getOptionValue: (option: T) => string;
  className?: string;
  outerClassName?: string;
  iconClassName?: string;
  alwaysShowPlaceholder?: boolean;
}
const DropDown = <T,>({
  label,
  value,
  onChange,
  disabled = false,
  placeholderValue = "",
  selectOptions,
  getOptionLabel,
  getOptionKey,
  getOptionValue,
  className = "",
  outerClassName = "",
  iconClassName = "text-muted-foreground",
  alwaysShowPlaceholder = false,
}: DropdownProps<T>) => {
  return (
    <div className={`flex flex-col gap-2 ${outerClassName}`}>
      {label && <label htmlFor="id">{label}</label>}
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <SelectTrigger
          icon= {<ICONS.ChevronDown
                  size={16}
                  className={`ml-auto ${iconClassName}`}
                />}
          className={`border-gray-300! text-primary-foreground ${className}`}
        >
          <SelectValue placeholder={placeholderValue}>
            {alwaysShowPlaceholder ? placeholderValue : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem
              key={getOptionKey(option)}
              value={getOptionValue(option)}
            >
              {getOptionLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DropDown;
