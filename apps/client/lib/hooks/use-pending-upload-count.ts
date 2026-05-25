"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/localDB";

/** Single IndexedDB scan for pending/failed chunks across all upload sessions. */
export function usePendingUploadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function scan() {
      try {
        const pending = await db.chunks.where("status").anyOf("pending", "failed").count();
        if (!cancelled) setCount(pending);
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void scan();
    const interval = setInterval(() => void scan(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
