'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ICONS } from '@/constants/constants';

interface SearchableDropdownProps<T> {
  options: T[];
  value?: string;
  onChange: (value: T) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onSearch?: (query: string) => Promise<T[]>;
  debounceMs?: number;
}

export function SearchableDropdown<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  label,
  required = false,
  className = '',
  disabled = false,
  onSearch,
  debounceMs = 300,
}: SearchableDropdownProps<T>) {
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return '';

    // First check if we have a stored selected option
    if (selectedOption && getOptionValue(selectedOption) === value) {
      return getOptionLabel(selectedOption);
    }

    // Fall back to searching in options array
    const foundOption = options.find(
      (option) => getOptionValue(option) === value
    );
    return foundOption ? getOptionLabel(foundOption) : '';
  }, [value, options, selectedOption, getOptionLabel, getOptionValue]);

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

  // Server-side search effect
  useEffect(() => {
    if (!onSearch) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearch, debounceMs]);

  // Reset display count when dropdown opens or search query changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [isDropdownOpen, searchQuery]);

  // Use server results when onSearch is provided and user has typed something,
  // otherwise filter client-side from options prop
  const allFilteredOptions = onSearch && searchQuery.trim()
    ? searchResults
    : options.filter((option) =>
        (getOptionLabel(option) ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Paginate the filtered options
  const filteredOptions = allFilteredOptions.slice(0, displayCount);
  const hasMore = displayCount < allFilteredOptions.length;

  const handleScroll = () => {
    const container = listContainerRef.current;
    if (!container || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when scrolled to within 20px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setDisplayCount((prev) => prev + PAGE_SIZE);
    }
  };

  const handleSelect = (option: T) => {
    setSelectedOption(option);
    onChange(option);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={selectedLabel ? '' : 'text-muted-foreground'}>
            {selectedLabel || placeholder}
          </span>
          <ICONS.ChevronDown size={16} className="text-muted-foreground" />
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
            <div
              ref={listContainerRef}
              onScroll={handleScroll}
              className="overflow-y-auto max-h-48"
            >
              {isSearching ? (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  Searching...
                </div>
              ) : filteredOptions.length > 0 ? (
                <>
                  {filteredOptions.map((option) => (
                    <button
                      key={getOptionValue(option)}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-foreground"
                    >
                      {getOptionLabel(option)}
                    </button>
                  ))}
                  {hasMore && (
                    <div className="px-3 py-2 text-muted-foreground text-sm text-center">
                      Scroll for more...
                    </div>
                  )}
                </>
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
