"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Cookies from "js-cookie";
import { useAuth } from "./auth.provider";
import { getTenants } from "@/actions/tenant.actions";
import type { Tenant } from "@/types/tenant.types";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";

// System tenant ID used for internal settings - should not appear in tenant selector
const SYSTEM_TENANT_ID = "_system";

// Time to show "Preparing..." state before loading
const SWITCHING_DELAY = 300;
// Time to wait for queries to settle after tenant switch
const QUERY_SETTLE_TIMEOUT = 300;
// Minimum time to show loading state (prevents flash)
const MIN_LOADING_TIME = 500;
// Time to show "Complete!" state before hiding overlay
const COMPLETE_DISPLAY_TIME = 400;
// Maximum time to wait before forcing switch completion
const MAX_SWITCH_TIMEOUT = 8000;

export type TenantSwitchState = 'idle' | 'switching' | 'loading' | 'settling' | 'complete';

type TenantContextType = {
  selectedTenantId: string;
  previousTenantId: string | null;
  setSelectedTenantId: (tenantId: string) => void;
  tenantIds: Tenant[];
  refreshTrigger: number;
  isSwitchingTenant: boolean;
  switchState: TenantSwitchState;
  switchingToTenant: Tenant | null;
  finishTenantSwitch: () => void;
  hasSwitchedTenant: boolean;
};

const initialState: TenantContextType = {
  selectedTenantId: "",
  previousTenantId: null,
  setSelectedTenantId: () => {},
  tenantIds: [],
  refreshTrigger: 0,
  isSwitchingTenant: false,
  switchState: 'idle',
  switchingToTenant: null,
  finishTenantSwitch: () => {},
  hasSwitchedTenant: false,
};

export const TenantContext = createContext<TenantContextType>(initialState);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize selectedTenantId from cookie to persist across page refreshes
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return Cookies.get("X-Tenant-ID") || "";
    }
    return "";
  });
  const [previousTenantId, setPreviousTenantId] = useState<string | null>(null);
  const [tenantIds, setTenantIds] = useState<Tenant[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [switchState, setSwitchState] = useState<TenantSwitchState>('idle');
  const [switchingToTenant, setSwitchingToTenant] = useState<Tenant | null>(null);
  const [hasSwitchedTenant, setHasSwitchedTenant] = useState(false);
  const { isSystemUser, user } = useAuth();
  const queryClient = useQueryClient();

  // Track active fetches to know when queries have settled
  const fetchingCount = useIsFetching();
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const switchStartTimeRef = useRef<number>(0);

  // Derived state for backwards compatibility
  const isSwitchingTenant = switchState !== 'idle' && switchState !== 'complete';

  // Monitor fetching state during tenant switch - wait for ALL queries to complete
  useEffect(() => {
    // Only transition from loading when:
    // 1. We're in loading state
    // 2. All queries have finished (fetchingCount === 0)
    // 3. Minimum loading time has passed
    if (switchState === 'loading' && fetchingCount === 0 && minLoadingTimePassed) {
      // All queries have finished, start settling period
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setSwitchState('settling');
      });

      // Wait a bit for any cascading queries
      settleTimeoutRef.current = setTimeout(() => {
        setSwitchState('complete');

        // Show "Complete!" for a moment before hiding overlay
        setTimeout(() => {
          setSwitchState('idle');
          setSwitchingToTenant(null);
          setMinLoadingTimePassed(false); // Reset for next switch
        }, COMPLETE_DISPLAY_TIME);
      }, QUERY_SETTLE_TIMEOUT);
    }

    return () => {
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, [switchState, fetchingCount, minLoadingTimePassed]);

  // Allow components to signal when they've finished loading after tenant switch
  const finishTenantSwitch = useCallback(() => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    setSwitchState('idle');
    setSwitchingToTenant(null);
  }, []);

  // Fetch tenants only for system users
  useEffect(() => {
    if (!isSystemUser || !user) return;

    const fetchTenants = async () => {
      const response = await getTenants();
      if (response.success && response.data) {
        // Filter out the system settings tenant (internal use only)
        const filteredTenants = response.data.filter(
          (tenant: Tenant) =>
            tenant.id !== SYSTEM_TENANT_ID && !tenant.id.startsWith("_"),
        );
        setTenantIds(filteredTenants);

        // Set first tenant as default if none selected or if selected tenant is invalid
        const savedTenantId = Cookies.get("X-Tenant-ID");
        const isValidSelection =
          savedTenantId && filteredTenants.some((t: Tenant) => t.id === savedTenantId);

        if (!isValidSelection && filteredTenants.length > 0) {
          const defaultTenantId = filteredTenants[0].id;
          setSelectedTenantId(defaultTenantId);
          // Set cookie immediately for the default selection
          Cookies.set("X-Tenant-ID", defaultTenantId, { path: "/" });
        } else if (isValidSelection && !selectedTenantId) {
          setSelectedTenantId(savedTenantId);
        }
      }
    };
    fetchTenants();
  }, [isSystemUser, user, selectedTenantId]);

  // Update refresh trigger when tenant selection changes for system users
  useEffect(() => {
    if (isSystemUser && selectedTenantId) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setRefreshTrigger((prev) => prev + 1);
      });
    }
  }, [selectedTenantId, isSystemUser]);

  const handleSetSelectedTenantId = useCallback(async (tenantId: string) => {
    if (tenantId === selectedTenantId) return;

    // Store previous tenant for potential rollback
    setPreviousTenantId(selectedTenantId);

    // Mark that a tenant switch has occurred (for hooks using initialData)
    setHasSwitchedTenant(true);

    // Reset min loading time flag
    setMinLoadingTimePassed(false);
    switchStartTimeRef.current = Date.now();

    // Find the tenant we're switching to for display purposes
    const targetTenant = tenantIds.find(t => t.id === tenantId) || null;
    setSwitchingToTenant(targetTenant);
    setSwitchState('switching');

    // Update cookie immediately so API calls use new tenant
    Cookies.set("X-Tenant-ID", tenantId, { path: "/" });

    // Clear the cache to ensure fresh data for new tenant
    queryClient.clear();

    // Update the selected tenant ID - this will trigger queries to refetch
    setSelectedTenantId(tenantId);

    // Show "Preparing..." for a moment before transitioning to loading
    setTimeout(async () => {
      // Transition to loading state - queries will now start fetching
      setSwitchState('loading');

      // Invalidate all React Query caches - triggers refetch with new tenant
      await queryClient.invalidateQueries();

      // Set minimum loading time to prevent flash
      setTimeout(() => {
        setMinLoadingTimePassed(true);
      }, MIN_LOADING_TIME);
    }, SWITCHING_DELAY);

    // Set maximum timeout as fallback
    switchTimeoutRef.current = setTimeout(() => {
      setMinLoadingTimePassed(false);
      setSwitchState('idle');
      setSwitchingToTenant(null);
    }, MAX_SWITCH_TIMEOUT);
  }, [selectedTenantId, tenantIds, queryClient]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TenantContext.Provider
      value={{
        selectedTenantId,
        previousTenantId,
        setSelectedTenantId: handleSetSelectedTenantId,
        tenantIds,
        refreshTrigger,
        isSwitchingTenant,
        switchState,
        switchingToTenant,
        finishTenantSwitch,
        hasSwitchedTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
