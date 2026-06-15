import { useState, useEffect, useRef } from "react";
import { C } from "../colors";

type SortMode = "recent" | "rating-down" | "rating-up" | "review";

export function SortFilter({
  sort,
  onChange,
}: {
  sort: SortMode;
  onChange: (s: SortMode) => void;
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

  const options: { value: SortMode; label: string }[] = [
    { value: "recent", label: "recent" },
    { value: "rating-down", label: "rating ↓" },
    { value: "rating-up", label: "rating ↑" },
    { value: "review", label: "review" },
  ];

  const label = options.find((o) => o.value === sort)?.label ?? "sort";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="min-w-26 h-8.5 border border-black text-[12px] px-2.5 outline-none cursor-pointer flex items-center justify-between gap-1.5 whitespace-nowrap"
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <div className="absolute top-9.5 right-0 z-50 border border-black bg-reef-cream min-w-full overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-[12px] flex items-center cursor-pointer hover:bg-black hover:text-reef-cream transition-colors"
              style={{
                background: sort === o.value ? C.red : "transparent",
                color: sort === o.value ? C.cream : "black",
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
