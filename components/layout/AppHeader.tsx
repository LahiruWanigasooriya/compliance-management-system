"use client";
import React, { useState, useRef, useEffect } from "react";
import { ICONS } from "../../constants/constants";
import { Moon, Sun, LogOut, User, ChevronDown, ArrowLeft, Bell } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { formatRoleName } from "@/utils/convertObjectKeysToCamelCase";
import { useAuth } from "../providers/auth.provider";
import SearchDropdown from "./SearchDropdown";
import TenantSelector from "./TenantSelector";
import { SearchResult, getNavigationPath } from "@/utils/search.types";
import { performGlobalSearch } from "@/actions/search.actions";
import { useDebounce } from "@/hooks/useDebounce";
import NotificationsDropdown from "../preUi/NotificationsDropdown";
import { Notification } from "@/types/notification.types";

type AppHeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications?: boolean;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
};

const AppHeader = ({
  sidebarOpen,
  setSidebarOpen,
  notifications,
  unreadCount,
  isLoadingNotifications,
  onMarkAllRead,
  onNotificationClick,
}: AppHeaderProps) => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { user, isSystemUser, signOut } = useAuth();
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useRouter();
  const currentPath = usePathname();
  const { theme, setTheme } = useTheme();

  const getUserInitials = (fullName: string | undefined) => {
    if (!fullName) return "?";
    const names = fullName.split(" ");
    const first = names[0]?.[0]?.toUpperCase() || "";
    const last = names[1]?.[0]?.toUpperCase() || "";
    return first + last || first || "?";
  };

  const handleLogout = () => {
    signOut();
  };

  const handleProfileNavigation = () => {
    setShowUserMenu(false);
    if (currentPath !== "/profile-settings") {
      sessionStorage.setItem("previousLocation", currentPath);
      navigate.push("/profile-settings");
    } else {
      const previous = sessionStorage.getItem("previousLocation") || "/";
      navigate.push(previous);
    }
  };

  const handleSidebarToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearch.trim()) {
        setIsSearching(true);
        setSelectedIndex(-1);
        try {
          const response = await performGlobalSearch(debouncedSearch);
          setSearchResults(response.results);
          setTotalCount(response.total_count);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
          setTotalCount(undefined);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setTotalCount(undefined);
        setShowSearchDropdown(false);
        setSelectedIndex(-1);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  const handleSearchResultClick = (result: SearchResult) => {
    const path = getNavigationPath(result);
    navigate.push(path);
    clearSearch();
  };

  const clearSearch = () => {
    setSearch("");
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    setTotalCount(undefined);
    setShowMobileSearch(false);
  };

  // Focus mobile input when opened
  useEffect(() => {
    if (showMobileSearch && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [showMobileSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown || searchResults.length === 0) {
      if (e.key === "Escape") {
        clearSearch();
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSearchResultClick(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        clearSearch();
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Collapse sidebar on mobile and close mobile search on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
      // Close mobile search when resizing to desktop (xl breakpoint = 1280px)
      if (window.innerWidth >= 1280 && showMobileSearch) {
        setShowMobileSearch(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen, showMobileSearch]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const MenuIcon = ICONS.Menu;
  const XIcon = ICONS.X;
  const SearchIcon = ICONS.Search;

  return (
    <>
      <header className="fixed w-full top-0 z-50 bg-secondary border-b border-white/10">
        <div className="h-14 xl:h-16 px-4 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={handleSidebarToggle}
              className="hidden xl:flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>

            {/* Logo - visible on all screens */}
            <div className="flex items-center ml-1 md:ml-3">
              <div>
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={100}
                  height={50}
                  className="flex-shrink-0"
                />
                <p className="text-xs text-white/70 hidden md:block">
                  Enterprise Compliance and Risk Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile search button */}
            <button
              onClick={() => setShowMobileSearch(true)}
              className="xl:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <SearchIcon size={20} />
            </button>

            {/* Desktop Search */}
            <div className="relative hidden xl:block" ref={searchRef}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search customers, cases, alerts..."
                  className="w-72 h-9 pl-9 pr-9 bg-white/5 border border-white/10 rounded-lg
                    text-sm text-white placeholder-white/40
                    focus:outline-none focus:bg-white/10 focus:border-white/20
                    transition-all duration-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => search.trim() && setShowSearchDropdown(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    type="button"
                    aria-label="Clear search"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showSearchDropdown && (
                <SearchDropdown
                  results={searchResults}
                  isLoading={isSearching}
                  query={search}
                  onResultClick={handleSearchResultClick}
                  selectedIndex={selectedIndex}
                  totalCount={totalCount}
                />
              )}
            </div>

            {/* Tenant Selector */}
            {isSystemUser && <TenantSelector />}

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationsDropdown
                  notifications={notifications}
                  onMarkAllRead={onMarkAllRead}
                  onNotificationClick={(notification) => {
                    onNotificationClick?.(notification);
                    setShowNotifications(false);
                  }}
                  onViewAll={() => {
                    navigate.push("/notifications");
                    setShowNotifications(false);
                  }}
                  isLoading={isLoadingNotifications}
                />
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/10" />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden ring-2 ring-white/10">
                  {user?.profile_image ? (
                    <Image
                      src={user.profile_image}
                      alt={user.full_name || "User"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {getUserInitials(user?.full_name)}
                    </span>
                  )}
                </div>

                {/* User info - hidden on smaller screens */}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-white leading-tight">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-[11px] text-white/50 capitalize">
                    {formatRoleName(user?.role || user?.role_name || "")}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className={`hidden lg:block text-white/50 transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={handleProfileNavigation}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <User size={16} className="text-gray-400" />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[60] bg-secondary">
          <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10">
            <button
              onClick={clearSearch}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close search"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search customers, cases, alerts..."
                className="w-full h-10 pl-9 pr-9 bg-white/5 border border-white/10 rounded-lg
                  text-sm text-white placeholder-white/40
                  focus:outline-none focus:bg-white/10 focus:border-white/20
                  transition-all duration-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  type="button"
                  aria-label="Clear search"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-56px)]">
            {search.trim() ? (
              <SearchDropdown
                results={searchResults}
                isLoading={isSearching}
                query={search}
                onResultClick={handleSearchResultClick}
                selectedIndex={selectedIndex}
                totalCount={totalCount}
                variant="inline"
              />
            ) : (
              <div className="p-8 text-center">
                <SearchIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-sm">
                  Search for customers, cases, or alerts
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
