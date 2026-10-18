'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ICONS } from '@/constants/constants';

interface MultiSelectSearchableDropdownProps<T> {
  options: T[];
  value: string[];
  onChange: (values: string[]) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  buttonClassName?: string;
  labelClassName?: string;
  dropdownClassName?: string;
}

export function MultiSelectSearchableDropdown<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  label,
  required = false,
  className = '',
  disabled = false,
  buttonClassName = '',
  labelClassName = '',
  dropdownClassName = '',
}: MultiSelectSearchableDropdownProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelection = (option: T) => {
    const optionValue = getOptionValue(option);
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((v) => v !== valueToRemove));
  };

  const selectedLabels = useMemo(() => {
    return value
      .map((v) => {
        const option = options.find((opt) => getOptionValue(opt) === v);
        return option ? getOptionLabel(option) : null;
      })
      .filter((label): label is string => label !== null);
  }, [value, options, getOptionLabel, getOptionValue]);

  return (
    <div className={className}>
      {label && (
        <label className={`${labelClassName ?? "block text-sm font-medium text-foreground mb-1"}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className={`w-full min-h-[42px] px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-left flex flex-wrap items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
        >
          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto max-h-8 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {selectedLabels.map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-card text-primary dark:text-white rounded-md text-sm"
                >
                  {label}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(value[index]);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemove(value[index]);
                      }
                    }}
                    className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer flex items-center"
                  >
                    <ICONS.X size={14} />
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-primary-foreground">{placeholder}</span>
          )}
          <ICONS.ChevronDown
            size={16}
            className="text-muted-foreground ml-auto"
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-panel-border rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-panel-border">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 border border-panel-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className={`overflow-y-auto max-h-44 ${dropdownClassName}`}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const optionValue = getOptionValue(option);
                  const isSelected = value.includes(optionValue);
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      onClick={() => handleToggleSelection(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors text-foreground flex items-center gap-2 ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-panel-border'
                        }`}
                      >
                        {isSelected && <ICONS.Check size={12} color="white" />}
                      </div>
                      {getOptionLabel(option)}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
