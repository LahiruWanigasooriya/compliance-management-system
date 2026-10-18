const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

/**
 * Generates a unique fingerprint based on browser characteristics
 */
function generateFingerprint(): string {
  const components: string[] = [];

  // Screen properties
  if (typeof window !== 'undefined' && window.screen) {
    components.push(`${window.screen.width}x${window.screen.height}`);
    components.push(`${window.screen.colorDepth}`);
    components.push(`${window.screen.pixelDepth || ''}`);
  }

  // Timezone
  try {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    components.push('');
  }

  // Language
  if (typeof navigator !== 'undefined') {
    components.push(navigator.language || '');
    components.push((navigator.languages || []).join(','));

    // Hardware concurrency (CPU cores)
    components.push(`${navigator.hardwareConcurrency || ''}`);

    // Device memory (if available)
    components.push(`${(navigator as any).deviceMemory || ''}`);

    // Platform
    components.push(navigator.platform || '');

    // Max touch points
    components.push(`${navigator.maxTouchPoints || 0}`);
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint', 2, 15);
      ctx.strokeStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
      ctx.stroke();
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('');
  }

  // Create hash from components (deterministic - no random values)
  const combinedString = components.join('|');
  return hashString(combinedString);
}

/**
 * Simple hash function to create a consistent fingerprint string
 * Uses FNV-1a algorithm for better distribution
 */
function hashString(str: string): string {
  // FNV-1a 32-bit hash for better distribution
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, keep as unsigned 32-bit
  }

  // Create a longer hash by running multiple rounds with different seeds
  let hash2 = 2166136261;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 ^= str.charCodeAt(i);
    hash2 = (hash2 * 16777619) >>> 0;
  }

  // Combine hashes for a longer, more unique fingerprint
  const hexHash1 = hash.toString(16).padStart(8, '0');
  const hexHash2 = hash2.toString(16).padStart(8, '0');

  return `${hexHash1}-${hexHash2}`;
}

/**
 * Gets the device fingerprint, generating one if it doesn't exist
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // Check if we already have a stored fingerprint
    let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);

    if (!fingerprint) {
      // Generate a new fingerprint
      fingerprint = generateFingerprint();
      localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
    }

    return fingerprint;
  } catch {
    // If localStorage is not available, generate a temporary one
    return generateFingerprint();
  }
}

/**
 * Clears the stored device fingerprint (useful for testing)
 */
export function clearDeviceFingerprint(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DEVICE_FINGERPRINT_KEY);
    } catch {
      // Ignore errors
    }
  }
}
