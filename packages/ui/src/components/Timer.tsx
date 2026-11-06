import { useState, useEffect, useRef, type FC } from "react";

export interface TimerProps {
  startTime: number;
  timeLimitMs: number;
  onTimeUp?: () => void;
}

export const Timer: FC<TimerProps> = ({ startTime, timeLimitMs, onTimeUp }) => {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - startTime;
    return Math.max(0, timeLimitMs - elapsed);
  });
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [startTime, timeLimitMs]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, timeLimitMs - elapsed);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeUpRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, timeLimitMs]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isLow = remaining < 2 * 60 * 1000;

  return (
    <span
      className={`font-mono text-lg font-bold tabular-nums ${
        isLow ? "text-red-500 animate-pulse" : "text-gray-300"
      }`}
    >
      ⏱ {display}
    </span>
  );
};
