import { addSeconds, format } from "date-fns";

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatTime(date: Date | string | number): string {
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: Date | string | number): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

/** Media offset / chapter markers (seconds → mm:ss or H:mm:ss). */
export function formatTimestamp(seconds: number): string {
  return formatDurationSeconds(seconds, seconds >= 3600);
}

/** Elapsed recording timer (HH:mm:ss). */
export function formatTimer(seconds: number): string {
  return formatDurationSeconds(seconds, true);
}

function formatDurationSeconds(totalSeconds: number, includeHours: boolean): string {
  const pattern = includeHours ? "H:mm:ss" : "mm:ss";
  return format(addSeconds(new Date(0), totalSeconds), pattern);
}
