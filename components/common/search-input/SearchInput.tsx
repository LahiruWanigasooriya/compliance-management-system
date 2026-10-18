import { ICONS } from "@/constants/constants";
import React, { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  inputFieldClassName?: string;
  onSearch?: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value: propValue,
  onChange,
  className = "",
  onSearch,
  inputFieldClassName,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const value = propValue !== undefined ? propValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <ICONS.Search size={18} className="text-gray-500 dark:text-white"/>
      </div>
      <input
        type="search"
        className={`focus:outline-none block w-full h-11 p-3 pl-10 rounded-lg bg-gray-50 border border-gray-300 placeholder:text-gray-500 text-gray-900 md:bg-gray-100 focus:ring-2 focus:ring-[#1A5276] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${inputFieldClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SearchInput; 