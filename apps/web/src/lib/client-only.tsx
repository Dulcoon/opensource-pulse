import { useEffect, useState, type ReactNode } from "react";

export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export function ClientDate({ date, format }: { date?: string | Date; format?: Intl.DateTimeFormatOptions }) {
  const [text, setText] = useState("—");
  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    setText(d.toLocaleDateString("en-US", format));
  }, [date]);
  return <>{text}</>;
}

export function ClientClock() {
  const [timeStr, setTimeStr] = useState("UTC --:--");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setTimeStr(`UTC ${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span>{timeStr}</span>;
}
