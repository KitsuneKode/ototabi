import { format, formatDistanceToNow } from "date-fns";

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatTime(date: Date | string | number): string {
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: Date | string | number): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function formatTimestamp(seconds: number): string {
  const d = new Date(0);
  d.setSeconds(seconds);
  const mmss = format(d, "mm:ss");
  if (seconds >= 3600) {
    const hh = Math.floor(seconds / 3600);
    return `${hh}:${mmss}`;
  }
  return mmss;
}

export function formatRelative(date: Date | string | number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
