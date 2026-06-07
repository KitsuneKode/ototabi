import { useEffect, useRef, useState } from "react";

export function useTimer(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);
  const [prevIsRunning, setPrevIsRunning] = useState(isRunning);

  if (isRunning !== prevIsRunning) {
    setPrevIsRunning(isRunning);
    if (isRunning) {
      setSeconds(0);
    }
  }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  return seconds;
}
