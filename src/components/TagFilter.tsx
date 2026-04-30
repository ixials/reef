import { useState, useEffect, useRef } from "react";

export function TagFilter({
  tagSections,
  selectedTags,
  onChange,
}: {
  tagSections: Record<string, Record<string, string>>;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
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
        className="h-[34px] border border-black text-[12px] px-2.5 outline-none cursor-pointer appearance-none flex items-center gap-1.5 whitespace-nowrap"
        style={{
          background: selectedTags.length > 0 ? "#E84832" : "transparent",
          color: selectedTags.length > 0 ? "#E7E4DE" : "black",
        }}
      >
        tags
        <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <div className="absolute pb-1 top-[38px] left-0 z-50 border border-black bg-[#E7E4DE] min-w-[160px] max-h-[220px] overflow-y-auto">
          {sections.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-black opacity-50">
              no tags yet
            </div>
          )}
          {sections.map(([section, tags]) => (
            <div key={section}>
              <div className="px-3 pt-2 pb-1 font-bold text-[13px] text-black mb-1 select-none">
                {section}
              </div>
              {Object.entries(tags).map(([tag, color]) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggle(tag)}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer hover:bg-black hover:text-[#E7E4DE] transition-colors"
                    style={{
                      background: active ? "#E84832" : "transparent",
                      color: active ? "#E7E4DE" : "black",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: active ? "#E7E4DE" : color,
                        flexShrink: 0,
                      }}
                    />
                    {tag}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
