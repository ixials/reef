import { useState, useEffect, useRef } from "react";
import { C } from "../colors";

type Period = "month" | "year" | "all";

export function PeriodFilter({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { value: Period; label: string }[] = [
    { value: "all", label: "all time" },
    { value: "year", label: "this year" },
    { value: "month", label: "this month" },
  ];

  const label = options.find((o) => o.value === period)?.label ?? "period";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="min-w-24 h-8.5 border border-black text-[12px] px-2.5 outline-none cursor-pointer flex items-center justify-between gap-1.5 whitespace-nowrap"
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <div className="absolute top-9.5 left-0 z-50 border border-black bg-reef-cream min-w-28 overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-[12px] flex items-center cursor-pointer hover:bg-black hover:text-reef-cream transition-colors"
              style={{
                background: period === o.value ? C.red : "transparent",
                color: period === o.value ? C.cream : "black",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
