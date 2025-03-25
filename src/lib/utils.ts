
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// New utility to get timezone information for debugging
export function getTimezoneInfo(): { 
  timezone: string; 
  offset: number; 
  currentTime: string;
  midnightToday: string;
} {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -now.getTimezoneOffset() / 60; // Convert to hours and invert (JS uses opposite sign)
  
  // Format the dates for debugging
  const currentTime = now.toLocaleString();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const midnightToday = midnight.toLocaleString();
  
  return { timezone, offset, currentTime, midnightToday };
}
