"use client";

import { useEffect, useState } from "react";

// The Chrome extension content script must dispatch this event on the page:
//   window.dispatchEvent(new CustomEvent("farcast-extension-installed"));
const EVENT_NAME = "farcast-extension-installed";
const DETECTION_TIMEOUT_MS = 1500;
const DISMISSED_KEY = "farcast_ext_modal_dismissed";

/**
 * Returns:
 *   null  — still detecting (within the timeout window)
 *   true  — extension is installed
 *   false — extension not detected after timeout
 */
export function useExtensionDetected(): boolean | null {
  const [detected, setDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const handler = () => setDetected(true);
    window.addEventListener(EVENT_NAME, handler);

    const timer = setTimeout(() => {
      setDetected((prev) => (prev === null ? false : prev));
    }, DETECTION_TIMEOUT_MS);

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      clearTimeout(timer);
    };
  }, []);

  return detected;
}

export function getExtModalDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(DISMISSED_KEY);
}

export function setExtModalDismissed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DISMISSED_KEY, "1");
}
