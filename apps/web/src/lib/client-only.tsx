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
