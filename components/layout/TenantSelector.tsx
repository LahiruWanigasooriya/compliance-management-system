"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ICONS } from "@/constants/constants";
import { useTenant, TenantSwitchState } from "../providers/tenant.provider";
import type { Tenant } from "@/types/tenant.types";

const TenantSelector: React.FC = () => {
  const {
    selectedTenantId,
    setSelectedTenantId,
    tenantIds,
    switchState,
    switchingToTenant,
  } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Check if tenants are still loading (have ID from cookie but no tenant list yet)
  const isLoadingTenants = Boolean(selectedTenantId) && tenantIds.length === 0;

  // Get currently selected tenant
  const selectedTenant = useMemo(
    () => tenantIds.find((t) => t.id === selectedTenantId),
    [tenantIds, selectedTenantId]
  );

  // Filter tenants based on search query
  const filteredTenants = useMemo(() => {
    if (!searchQuery.trim()) return tenantIds;
    const query = searchQuery.toLowerCase();
    return tenantIds.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(query) ||
        tenant.id.toLowerCase().includes(query)
    );
  }, [tenantIds, searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (tenant: Tenant) => {
    setSelectedTenantId(tenant.id);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTenants.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredTenants.length) {
          handleSelect(filteredTenants[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  const getSwitchStateInfo = (state: TenantSwitchState) => {
    switch (state) {
      case "switching":
        return { text: "Preparing...", color: "text-blue-400" };
      case "loading":
        return { text: "Loading...", color: "text-amber-400" };
      case "settling":
        return { text: "Finalizing...", color: "text-green-400" };
      case "complete":
        return { text: "Ready!", color: "text-green-400" };
      default:
        return null;
    }
  };

  const switchInfo = getSwitchStateInfo(switchState);
  const isSwitching = switchState !== "idle";

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !isSwitching && !isLoadingTenants && setIsOpen(!isOpen)}
        disabled={isSwitching || isLoadingTenants}
        className={`
          h-[38px] flex items-center gap-2 px-3 rounded-lg border transition-all duration-200 cursor-pointer
          ${isSwitching || isLoadingTenants
            ? "border-white/20 bg-white/5 cursor-wait"
            : isOpen
            ? "border-white/40 bg-white/10"
            : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Building Icon */}
        <ICONS.Building className="h-4 w-4 text-white/60 flex-shrink-0" />

        {/* Tenant Name, Loading State, or Switching State */}
        {isLoadingTenants ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
          </div>
        ) : (
          <span className="text-sm font-medium text-white truncate max-w-[120px]">
            {isSwitching && switchingToTenant
              ? switchingToTenant.name
              : selectedTenant
              ? selectedTenant.name
              : "Select tenant"}
          </span>
        )}

        {/* Status Indicator or Chevron */}
        {isSwitching ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            {switchInfo && (
              <span className={`text-xs ${switchInfo.color} whitespace-nowrap`}>{switchInfo.text}</span>
            )}
          </div>
        ) : isLoadingTenants ? (
          <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
        ) : (
          <ICONS.ChevronDown
            className={`h-4 w-4 text-white/60 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !isSwitching && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <ICONS.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <ICONS.X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tenant Count */}
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredTenants.length} tenant{filteredTenants.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>

          {/* Tenant List */}
          <div ref={listRef} className="max-h-64 overflow-y-auto" role="listbox">
            {filteredTenants.length === 0 ? (
              <div className="p-4 text-center">
                <ICONS.Building className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tenants found
                </p>
              </div>
            ) : (
              filteredTenants.map((tenant, index) => {
                const isSelected = tenant.id === selectedTenantId;
                const isHighlighted = index === selectedIndex;

                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => handleSelect(tenant)}
                    className={`
                      w-full px-3 py-2.5 flex items-center gap-3 transition-colors duration-100 cursor-pointer
                      ${isHighlighted
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }
                      ${isSelected ? "bg-green-50 dark:bg-green-900/10" : ""}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Tenant Icon */}
                    <div
                      className={`
                        h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold
                        ${isSelected
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }
                      `}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Tenant Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {tenant.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {tenant.id}
                      </span>
                    </div>

                    {/* Check Icon for Selected */}
                    {isSelected && (
                      <ICONS.Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd>
              {" "}navigate{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↵</kbd>
              {" "}select{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">esc</kbd>
              {" "}close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
