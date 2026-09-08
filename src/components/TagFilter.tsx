import { useState, useEffect, useRef } from "react";
import { C } from "../colors";

export function TagFilter({
  tagSections,
  selectedTags,
  onChange,
  isAdmin,
  onOpenTags,
}: {
  tagSections: Record<string, Record<string, string>>;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  isAdmin?: boolean;
  onOpenTags?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (tag: string) => {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    );
  };

  const sections = Object.entries(tagSections);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full min-w-20 h-8.5 border border-reef-text text-[12px] px-2.5 outline-none cursor-pointer appearance-none flex items-center justify-between gap-1.5 whitespace-nowrap"
        style={{
          background: selectedTags.length > 0 ? C.theme : "transparent",
          color: selectedTags.length > 0 ? C.bg : C.text,
        }}
      >
        tags
        <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <div className="absolute top-9.5 left-0 z-50 border border-reef-text bg-reef-text min-w-40 max-h-55 overflow-y-auto">
          {sections.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-reef-text opacity-50">
              no tags yet
            </div>
          )}
          {sections.map(([section, tags], si) => (
            <div key={section}>
              <div className="px-3 pt-2 font-bold text-[13px] text-reef-text mb-1 select-none">
                {section}
              </div>
              {Object.entries(tags).map(([tag, color], ti) => {
                const active = selectedTags.includes(tag);
                const last =
                  si === sections.length - 1 &&
                  ti === Object.entries(tags).length - 1;
                return (
                  <button
                    key={tag}
                    onClick={() => toggle(tag)}
                    className={`w-full text-left px-3 text-xs flex items-center gap-2 cursor-pointer hover:bg-reef-text hover:text-reef-bg transition-colors ${last ? "pt-1.5 pb-3" : "py-1.5"}`}
                    style={{
                      background: active ? C.theme : "transparent",
                      color: active ? C.bg : C.text,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: active ? C.bg : color,
                        flexShrink: 0,
                      }}
                    />
                    {tag}
                  </button>
                );
              })}
            </div>
          ))}
          {isAdmin && onOpenTags && (
            <button
              onClick={() => {
                setOpen(false);
                onOpenTags();
              }}
              className="w-full text-left px-3 p-2 font-bold text-[13px] text-reef-default hover:text-reef-theme transition-colors cursor-pointer border-reef-text border-t"
            >
              edit tags
            </button>
          )}
        </div>
      )}
    </div>
  );
}
