"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useSidebarLinks } from "@/hooks/useSidebarLinks";
import { useSidebarCounts } from "@/hooks/useSidebarCounts";
import { useState, useEffect, useRef } from "react";

type SideBarProps = {
  sidebarOpen: boolean;
  fraudData: any;
  aiMetrics: any;
};

const KYC_ALERTS_NAV_KEY = "kyc-alerts:sidebar-nav";
const KYC_MASTER_NAV_KEY = "kyc-master:sidebar-nav";
const WATCHLIST_SCREENINGS_NAV_KEY = "watchlist-screenings:sidebar-nav";
const WATCHLIST_INTERNAL_NAV_KEY = "watchlist-internal:sidebar-nav";

const Sidebar = ({ sidebarOpen, fraudData }: SideBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const prevPathnameRef = useRef(pathname);

  // Get the section context from query parameter (for detail pages)
  const fromSection = searchParams.get("from");

  // Only returns links the user has privilege to see
  const filteredLinks = useSidebarLinks();

  // Fetch sidebar counts using React Query
  const {
    kycPendingCount,
    watchlistPendingCount,
    totalCustomers,
    activeCases,
    pendingGeoAlertCount,
  } = useSidebarCounts();

  // Auto-expand items that contain the current path
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    filteredLinks.forEach((item) => {
      if (item?.subItems) {
        const isOnSubItem = item.subItems.some((sub: { link: string }) =>
          pathname.startsWith(sub.link),
        );
        if (isOnSubItem) {
          setExpandedItems((prev) => new Set([...prev, item.id]));
        }
      }
    });
  }, [pathname, filteredLinks]);

  const isItemActive = (item: any) => {
    if (item.subItems?.length) {
      // Check if any sub-item matches the pathname
      const pathMatches = item.subItems.some(
        (sub: any) =>
          pathname === sub.link || pathname.startsWith(sub.link + "/"),
      );

      // Also check if we're on a detail page with a fromSection for this item
      if (!pathMatches && fromSection && item.id === "kyc") {
        return fromSection === "alerts" || fromSection === "kyc-master";
      }

      return pathMatches;
    }
    return pathname === item.link || pathname.startsWith(item.link + "/");
  };

  const isItemExpanded = (item: any) => {
    return expandedItems.has(item.id);
  };

  const toggleExpand = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleNavClick = (item: any) => {
    if (item.subItems?.length) {
      const firstSubItemLink = item.subItems[0].link;
      if (firstSubItemLink === "/kyc/alerts") {
        sessionStorage.setItem(KYC_ALERTS_NAV_KEY, "true");
      } else if (firstSubItemLink === "/kyc") {
        sessionStorage.setItem(KYC_MASTER_NAV_KEY, "true");
      } else if (firstSubItemLink === "/watchlist") {
        sessionStorage.setItem(WATCHLIST_SCREENINGS_NAV_KEY, "true");
      } else if (firstSubItemLink === "/watchlist/internal") {
        sessionStorage.setItem(WATCHLIST_INTERNAL_NAV_KEY, "true");
      }
    } else {
      if (item.link === "/kyc/alerts") {
        sessionStorage.setItem(KYC_ALERTS_NAV_KEY, "true");
      } else if (item.link === "/kyc") {
        sessionStorage.setItem(KYC_MASTER_NAV_KEY, "true");
      } else if (item.link === "/watchlist") {
        sessionStorage.setItem(WATCHLIST_SCREENINGS_NAV_KEY, "true");
      } else if (item.link === "/watchlist/internal") {
        sessionStorage.setItem(WATCHLIST_INTERNAL_NAV_KEY, "true");
      }
    }

    if (item.subItems?.length) {
      // If not expanded, expand and navigate to first sub-item
      if (!isItemExpanded(item)) {
        setExpandedItems((prev) => new Set([...prev, item.id]));
        if (!isItemActive(item)) {
          router.push(item.subItems[0].link);
        }
      } else {
        // If already expanded and not active, navigate
        if (!isItemActive(item)) {
          router.push(item.subItems[0].link);
        }
      }
    } else {
      router.push(item.link);
    }
  };

  const getBadgeValue = (item: any) => {
    const badgeValue = item.badgeKey ? fraudData?.[item.badgeKey] : null;

    if (item.id === "kyc" && kycPendingCount !== null) return kycPendingCount;
    if (item.id === "watchlist" && watchlistPendingCount !== null)
      return watchlistPendingCount;
    if (item.id === "customers" && totalCustomers !== null)
      return totalCustomers;
    if (item.id === "cases" && activeCases !== null) return activeCases;
    if (item.id === "geolocation" && pendingGeoAlertCount !== null)
      return pendingGeoAlertCount;

    return badgeValue;
  };

  const formatBadge = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value > 99 ? "99+" : value;
  };

  return (
    <aside
      className={`
        fixed left-0 xl:top-16 top-14 h-[calc(100vh-3.5rem)] xl:h-[calc(100vh-4rem)]
        bg-secondary border-r border-white/10
        transform transition-all duration-300 ease-in-out z-40
        flex flex-col
        ${sidebarOpen ? "w-60" : "w-16"}
      `}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible py-4 px-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <ul className="space-y-1">
          {filteredLinks.map((item) => {
            if (!item) return null;
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const isExpanded = isItemExpanded(item);
            const badgeValue = getBadgeValue(item);
            const isHovered = hoveredItem === item.id;
            const hasSubItems = (item.subItems?.length ?? 0) > 0;

            return (
              <li key={item.id}>
                {/* Main nav item */}
                <div
                  onClick={() => handleNavClick(item)}
                  onMouseEnter={(e) => {
                    setHoveredItem(item.id);
                    if (!sidebarOpen) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        top: rect.top + rect.height / 2,
                        left: rect.right + 12,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                    setTooltipPosition(null);
                  }}
                  className={`
                    relative flex items-center rounded-lg cursor-pointer
                    transition-all duration-150 group
                    ${sidebarOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                    ${
                      isActive
                        ? "bg-emerald-500/15 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span
                    className={`flex-shrink-0 ${sidebarOpen ? "" : "mx-auto"}`}
                  >
                    <Icon
                      size={20}
                      className={isActive ? "text-emerald-400" : ""}
                    />
                  </span>

                  {/* Label and badge row */}
                  {sidebarOpen && (
                    <div className="flex items-center flex-1 min-w-0 ml-3">
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>

                      {/* Badge - positioned after label */}
                      {badgeValue !== null && badgeValue !== 0 && (
                        <span
                          className={`
                            ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded
                            ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-white/10 text-white/60"
                            }
                          `}
                        >
                          {formatBadge(badgeValue)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expand/collapse chevron */}
                  {hasSubItems && sidebarOpen && (
                    <button
                      onClick={(e) => toggleExpand(item.id, e)}
                      className="p-1 rounded hover:bg-white/10 transition-colors ml-1"
                    >
                      <ChevronRight
                        size={16}
                        className={`
                          text-white/40 transition-transform duration-200 cursor-pointer
                          ${isExpanded ? "rotate-90" : ""}
                        `}
                      />
                    </button>
                  )}

                  {/* Collapsed state badge indicator */}
                  {!sidebarOpen && badgeValue !== null && badgeValue !== 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}

                  {/* Tooltip for collapsed sidebar */}
                  {!sidebarOpen && isHovered && tooltipPosition && (
                    <div
                      className="fixed z-[9999] -translate-y-1/2 pointer-events-none cursor-pointer"
                      style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                      }}
                    >
                      <div className="bg-secondary text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
                        <div className="font-medium">{item.label}</div>
                        {badgeValue !== null && badgeValue !== 0 && (
                          <div className="text-xs text-emerald-400 mt-0.5">
                            {badgeValue} pending
                          </div>
                        )}
                      </div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-secondary rotate-45 border-l border-b border-white/10" />
                    </div>
                  )}
                </div>

                {/* Sub items */}
                {hasSubItems && isExpanded && sidebarOpen && item.subItems && (
                  <ul className="mt-1 space-y-0.5">
                    {item.subItems.map((sub: any) => {
                      let subActive = false;

                      // If viewing a detail page, use the 'from' parameter to determine which sub-item stays active
                      if (fromSection) {
                        // Map the 'from' parameter to the correct sub-item
                        if (
                          fromSection === "alerts" &&
                          sub.link === "/kyc/alerts"
                        ) {
                          subActive = true;
                        } else if (
                          fromSection === "kyc-master" &&
                          sub.link === "/kyc"
                        ) {
                          subActive = true;
                        }
                      } else {
                        // Otherwise, use pathname matching
                        const matchingSubItems = item.subItems.filter(
                          (s: any) =>
                            pathname === s.link ||
                            pathname.startsWith(s.link + "/"),
                        );
                        const mostSpecificMatch = matchingSubItems.reduce(
                          (longest: any, current: any) =>
                            !longest ||
                            current.link.length > longest.link.length
                              ? current
                              : longest,
                          null,
                        );
                        subActive = mostSpecificMatch?.link === sub.link;
                      }

                      return (
                        <li key={sub.id}>
                          <button
                            onClick={() => {
                              if (sub.link === "/kyc/alerts") {
                                sessionStorage.setItem(
                                  KYC_ALERTS_NAV_KEY,
                                  "true",
                                );
                              } else if (sub.link === "/kyc") {
                                sessionStorage.setItem(
                                  KYC_MASTER_NAV_KEY,
                                  "true",
                                );
                              } else if (sub.link === "/watchlist") {
                                sessionStorage.setItem(
                                  WATCHLIST_SCREENINGS_NAV_KEY,
                                  "true",
                                );
                              } else if (
                                sub.link === "/watchlist/internal"
                              ) {
                                sessionStorage.setItem(
                                  WATCHLIST_INTERNAL_NAV_KEY,
                                  "true",
                                );
                              }
                              router.push(sub.link);
                            }}
                            className={`
                              w-full text-left pl-11 pr-3 py-2 rounded-lg text-sm
                              transition-all duration-150 cursor-pointer
                              ${
                                subActive
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
                              }
                            `}
                          >
                            {sub.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <div
          className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}
        >
          {sidebarOpen ? (
            <>
              <span className="text-[11px] text-white/40 uppercase tracking-wider">
                Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-white/70">Online</span>
              </div>
            </>
          ) : (
            <div className="relative flex h-2.5 w-2.5" title="System Online">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
