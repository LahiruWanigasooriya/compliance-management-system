// Environment suffixes used across different deployment environments
const ENV_SUFFIXES = ['-dev', '-qa', '-staging', '-uat', '-prod'];

// System console subdomain (for system users)
const SYSTEM_SUBDOMAIN = 'console';

/**
 * Check if running on localhost (development mode)
 */
export function isLocalhost(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window?.location?.hostname || '';
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Get dev mode override from localStorage (only works on localhost)
 */
function getDevModeOverride(): 'system' | 'tenant' | null {
    if (!isLocalhost()) return null;
    const override = localStorage.getItem('devUserType');
    if (override === 'system' || override === 'tenant') {
        return override;
    }
    return null;
}

/**
 * Strips environment suffix from subdomain
 * Examples: "tenant-dev" -> "tenant", "tenant-qa" -> "tenant", "console-staging" -> "console"
 */
export function stripEnvironmentSuffix(subdomain: string): string {
    for (const suffix of ENV_SUFFIXES) {
        if (subdomain.endsWith(suffix)) {
            return subdomain.slice(0, -suffix.length);
        }
    }
    return subdomain;
}

/**
 * Extracts the subdomain from the current hostname
 * Returns the raw subdomain without environment suffix stripping
 */
export function getSubdomain(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const hostname = window?.location?.hostname || '';
    const parts = hostname.split('.');

    // Need at least 3 parts for subdomain (sub.domain.tld)
    if (parts.length < 3) {
        return '';
    }

    // For exactly 3 parts: subdomain.domain.tld
    if (parts.length === 3) {
        return parts[0];
    }

    // For more parts: sub1.sub2.domain.tld -> sub1.sub2
    return parts.slice(0, parts.length - 2).join('.');
}

export function getBaseSubdomain(subdomain: string): string {
    return stripEnvironmentSuffix(subdomain);
}

/**
 * Checks if the current subdomain is the system console
 * Supports: console.vesant.ai, console-dev.vesant.ai, console-qa.vesant.ai, etc.
 */
export function isSystemConsole(): boolean {
    const subdomain = getSubdomain();
    if (!subdomain) {
        return false;
    }

    const baseSubdomain = stripEnvironmentSuffix(subdomain);
    return baseSubdomain === SYSTEM_SUBDOMAIN;
}

/**
 * Gets the user type based on the current subdomain
 * Returns 'system' for console subdomain, 'tenant' for tenant subdomains
 * On localhost, checks for devUserType override in localStorage
 */
export function getUserType(): 'system' | 'tenant' {
    // Check for dev mode override on localhost
    const devOverride = getDevModeOverride();
    if (devOverride) {
        console.log('Dev mode override active:', devOverride);
        return devOverride;
    }

    return isSystemConsole() ? 'system' : 'tenant';
}

/**
 * Extracts tenant ID from the current hostname subdomain
 * Returns empty string for system console (console.vesant.ai)
 * On localhost with system user override, returns empty string
 *
 * Examples:
 * - casino-a-dev.vesant.ai -> "casino-a"
 * - casino-a-qa.vesant.ai -> "casino-a"
 * - casino-a.vesant.ai -> "casino-a"
 * - console-dev.vesant.ai -> "" (system user, no tenant)
 * - console.vesant.ai -> "" (system user, no tenant)
 * - localhost with devUserType=system -> "" (dev system user)
 */
export function getTenantId(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    // Check for dev mode override on localhost
    const devOverride = getDevModeOverride();
    if (devOverride === 'system') {
        console.log('Dev mode: system user, no tenant ID');
        return '';
    }

    const subdomain = getSubdomain();

    if (!subdomain) {
        console.log('No subdomain found.');
        return '';
    }

    // Strip environment suffix
    const baseSubdomain = stripEnvironmentSuffix(subdomain);
    console.log('Subdomain found:', subdomain, '-> base:', baseSubdomain);

    // Return empty for system console (system users don't have a tenant)
    if (baseSubdomain === SYSTEM_SUBDOMAIN) {
        console.log('System console detected, no tenant ID');
        return '';
    }

    // Return empty for reserved subdomains
    if (baseSubdomain === 'www' || baseSubdomain === 'api' || baseSubdomain === '') {
        console.log('Reserved subdomain, no tenant ID');
        return '';
    }

    return baseSubdomain;
}
