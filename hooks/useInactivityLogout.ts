"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

interface UseInactivityLogoutOptions {
  timeout?: number; // Timeout in milliseconds
  onInactive?: () => void;
  enabled?: boolean;
}

/**
 * Hook to automatically logout user after a period of inactivity
 * Tracks mouse movements, keyboard events, clicks, touches, and scrolling
 */
export function useInactivityLogout({
  timeout = 48 * 60 * 60 * 1000, // 48 hours
  onInactive,
  enabled = true,
}: UseInactivityLogoutOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleActivity = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        // Call custom callback if provided
        if (onInactive) {
          onInactive();
        }

        // Logout the user
        await signOut({
          callbackUrl: "/login?session_expired=true",
          redirect: true,
        });
      }, timeout);
    };

    // Events to track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize the timeout
    handleActivity();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, onInactive, enabled]);
}
