"use client";
import React, { useEffect, useRef } from "react";
import { SearchResult, getSearchEntityTypeInfo } from "@/utils/search.types";
import { ICONS } from "@/constants/constants";

interface SearchDropdownProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onResultClick: (result: SearchResult) => void;
  selectedIndex: number;
  totalCount?: number;
  variant?: "dropdown" | "inline";
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  results,
  isLoading,
  query,
  onResultClick,
  selectedIndex,
  totalCount,
  variant = "dropdown",
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!query.trim()) {
    return null;
  }

  const isInline = variant === "inline";

  return (
    <div className={`
      ${isInline
        ? "bg-transparent"
        : "absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[420px] overflow-hidden"
      }
    `}>
      {/* Header with result count */}
      {!isLoading && results.length > 0 && (
        <div className={`px-3 py-2 border-b ${isInline ? "border-white/10 bg-white/5" : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isInline ? "text-white/60" : "text-gray-500 dark:text-gray-400"}`}>
              {totalCount !== undefined ? (
                <>Showing {results.length} of {totalCount} results</>
              ) : (
                <>{results.length} result{results.length !== 1 ? 's' : ''}</>
              )}
            </span>
            {!isInline && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd>
                {' '}navigate{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↵</kbd>
                {' '}select
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results list */}
      <div ref={listRef} className={`overflow-y-auto ${isInline ? "" : "max-h-[360px]"}`}>
        {isLoading ? (
          <div className="p-4">
            {/* Loading skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                <div className={`w-8 h-8 rounded-lg ${isInline ? "bg-white/10" : "bg-gray-200 dark:bg-gray-700"}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 rounded w-3/4 ${isInline ? "bg-white/10" : "bg-gray-200 dark:bg-gray-700"}`} />
                  <div className={`h-3 rounded w-1/2 ${isInline ? "bg-white/5" : "bg-gray-100 dark:bg-gray-800"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center">
            <ICONS.Search className={`h-8 w-8 mx-auto mb-2 ${isInline ? "text-white/20" : "text-gray-300 dark:text-gray-600"}`} />
            <p className={`text-sm ${isInline ? "text-white/60" : "text-gray-500 dark:text-gray-400"}`}>
              No results found for &quot;<span className="font-medium">{query}</span>&quot;
            </p>
            <p className={`text-xs mt-1 ${isInline ? "text-white/40" : "text-gray-400 dark:text-gray-500"}`}>
              Try searching for customers, cases, or alerts
            </p>
          </div>
        ) : (
          <div className={`divide-y ${isInline ? "divide-white/10" : "divide-gray-100 dark:divide-gray-800"}`}>
            {results.map((result, index) => (
              <SearchResultItem
                key={`${result.entity_type}-${result.entity_id}-${index}`}
                result={result}
                onClick={() => onResultClick(result)}
                isSelected={index === selectedIndex}
                query={query}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint - only show for dropdown */}
      {!isInline && !isLoading && results.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">esc</kbd>
            {' '}to close
          </span>
        </div>
      )}
    </div>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
  isSelected: boolean;
  query: string;
  variant?: "dropdown" | "inline";
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onClick,
  isSelected,
  query,
  variant = "dropdown",
}) => {
  const isInline = variant === "inline";
  const { label, color, bgColor, icon } = getSearchEntityTypeInfo(result.entity_type);

  // Get icon component
  const IconComponent = (ICONS as any)[icon] || ICONS.Search;

  // Highlight matching text in snippet
  const highlightMatches = (text: string) => {
    // First check if text contains <mark> tags from backend
    if (text.includes('<mark>')) {
      const parts = text.split(/(<mark>.*?<\/mark>)/g);
      return parts.map((part, i) => {
        if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
          const content = part.replace(/<\/?mark>/g, '');
          return (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">
              {content}
            </span>
          );
        }
        return part;
      });
    }

    // Fallback: highlight query terms
    if (!query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Clean snippet for display (limit length)
  const cleanSnippet = result.snippet
    .replace(/<mark>/g, '<mark>')
    .replace(/<\/mark>/g, '</mark>')
    .substring(0, 120);

  // Get additional metadata to display
  const getMetadataDisplay = () => {
    const items: string[] = [];

    if (result.metadata?.customer_id) {
      items.push(`ID: ${result.metadata.customer_id}`);
    }
    if (result.metadata?.account_number) {
      items.push(`Acc: ${result.metadata.account_number}`);
    }
    if (result.metadata?.status) {
      items.push(result.metadata.status);
    }
    if (result.metadata?.category) {
      items.push(result.metadata.category);
    }

    return items.slice(0, 2).join(' • ');
  };

  const metadataDisplay = getMetadataDisplay();

  const ChevronIcon = ICONS.ChevronRight;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 transition-colors duration-100 flex items-start gap-3 border-0 cursor-pointer
        ${isSelected
          ? isInline ? 'bg-white/10' : 'bg-blue-50 dark:bg-blue-900/20'
          : isInline ? 'hover:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
    >
      <div className={`${isInline ? 'bg-white/10' : bgColor} p-2 rounded-lg flex-shrink-0`}>
        <IconComponent className={`h-4 w-4 ${isInline ? 'text-white/70' : color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm font-medium truncate ${isInline ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {highlightMatches(result.title)}
          </h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${isInline ? 'bg-white/10 text-white/70' : `${bgColor} ${color}`}`}>
            {label}
          </span>
        </div>
        <p className={`text-xs line-clamp-1 ${isInline ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}>
          {highlightMatches(cleanSnippet.replace(/<\/?mark>/g, ''))}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {metadataDisplay && (
            <span className={`text-[10px] ${isInline ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
              {metadataDisplay}
            </span>
          )}
          {result.metadata?.risk_level && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${result.metadata.risk_level === 'high' || result.metadata.risk_level === 'critical'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : result.metadata.risk_level === 'medium'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
              {result.metadata.risk_level} risk
            </span>
          )}
          {result.metadata?.risk_category && !result.metadata?.risk_level && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${result.metadata.risk_category === 'critical' || result.metadata.risk_category === 'high'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : result.metadata.risk_category === 'medium'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
              {result.metadata.risk_category}
            </span>
          )}
        </div>
      </div>
      <ChevronIcon className={`h-4 w-4 flex-shrink-0 mt-1 transition-colors
        ${isSelected ? (isInline ? 'text-white' : 'text-blue-500') : (isInline ? 'text-white/30' : 'text-gray-300 dark:text-gray-600')}`}
      />
    </button>
  );
};

export default SearchDropdown;
