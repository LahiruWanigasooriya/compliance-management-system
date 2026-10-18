'use client';

import { useState, useSyncExternalStore } from 'react';
import { USER_TYPES, UserType } from '@/constants/application';

// useSyncExternalStore helpers for isDevMode
function subscribeToNothing() {
    // hostname doesn't change, so no subscription needed
    return () => {};
}

function getIsDevModeSnapshot() {
    const hostname = window?.location?.hostname || '';
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getIsDevModeServerSnapshot() {
    return false;
}

// useSyncExternalStore helpers for devUserType
function getDevUserTypeSnapshot(): UserType | null {
    const hostname = window?.location?.hostname || '';
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isDev) return null;

    const saved = localStorage.getItem('devUserType') as UserType | null;
    if (saved && (saved === USER_TYPES.SYSTEM || saved === USER_TYPES.TENANT)) {
        return saved;
    }
    return null;
}

function getDevUserTypeServerSnapshot(): UserType | null {
    return null;
}

/**
 * Development helper hook for testing different user types
 * Only works in development mode (localhost)
 *
 * Usage:
 * const { devUserType, setDevUserType, isDevMode } = useDevMode();
 *
 * In your component:
 * {isDevMode && (
 *   <select onChange={(e) => setDevUserType(e.target.value)}>
 *     <option value="tenant">Tenant User</option>
 *     <option value="system">System User</option>
 *   </select>
 * )}
 */
export function useDevMode() {
    // Use useSyncExternalStore for SSR-safe browser API access
    const isDevMode = useSyncExternalStore(
        subscribeToNothing,
        getIsDevModeSnapshot,
        getIsDevModeServerSnapshot
    );

    // Initialize devUserType from external store, then manage locally for updates
    const initialDevUserType = useSyncExternalStore(
        subscribeToNothing,
        getDevUserTypeSnapshot,
        getDevUserTypeServerSnapshot
    );

    const [devUserType, setDevUserType] = useState<UserType | null>(initialDevUserType);

    const updateDevUserType = (type: UserType | null) => {
        setDevUserType(type);
        if (type) {
            localStorage.setItem('devUserType', type);
        } else {
            localStorage.removeItem('devUserType');
        }
        // Reload to apply changes
        window.location.reload();
    };

    return {
        devUserType,
        setDevUserType: updateDevUserType,
        isDevMode,
        isDevSystemUser: devUserType === USER_TYPES.SYSTEM,
        isDevTenantUser: devUserType === USER_TYPES.TENANT,
    };
}

/**
 * Get the dev user type override (for use in non-hook contexts)
 * Returns null if not in dev mode or no override set
 */
export function getDevUserTypeOverride(): UserType | null {
    if (typeof window === 'undefined') return null;

    const hostname = window?.location?.hostname || '';
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!isDev) return null;

    const saved = localStorage.getItem('devUserType') as UserType | null;
    if (saved && (saved === USER_TYPES.SYSTEM || saved === USER_TYPES.TENANT)) {
        return saved;
    }

    return null;
}
