import { useState } from "react";
import { C } from "../colors";

export type TagSections = Record<string, Record<string, string>>;

const STORAGE_KEY = "reef_custom_tags";

export function loadCustomTags(): TagSections {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomTags(tags: TagSections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

interface Props {
  customTags: TagSections;
  onSave: (tags: TagSections) => void;
  onClose: () => void;
}

export function TagModal({ customTags, onSave, onClose }: Props) {
  const [tags, setTags] = useState<TagSections>(
    JSON.parse(JSON.stringify(customTags)),
  );

  const [newSection, setNewSection] = useState("");
  const [newTagName, setNewTagName] = useState<Record<string, string>>({});
  const [newTagColor, setNewTagColor] = useState<Record<string, string>>({});

  const addSection = () => {
    const key = newSection.trim().toLowerCase();
    if (!key || tags[key]) return;
    setTags((prev) => ({ ...prev, [key]: {} }));
    setNewSection("");
  };

  const deleteSection = (section: string) => {
    setTags((prev) => {
      const next = { ...prev };
      delete next[section];
      return next;
    });
  };

  const addTag = (section: string) => {
    const name = (newTagName[section] ?? "").trim().toLowerCase();
    const color = newTagColor[section]?.trim() || "#ABA8A3";
    if (!name) return;
    setTags((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: color },
    }));
    setNewTagName((p) => ({ ...p, [section]: "" }));
    setNewTagColor((p) => ({ ...p, [section]: "" }));
  };

  const deleteTag = (section: string, tag: string) => {
    setTags((prev) => {
      const next = { ...prev, [section]: { ...prev[section] } };
      delete next[section][tag];
      return next;
    });
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-reef-cream p-7 max-w-[95vw] max-h-[80vh] rounded-xl border-2 border-reef-red flex flex-col min-w-0">
        <h2
          className="mb-2 text-[34px] text-reef-red tracking-widest"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          edit tags
        </h2>

        <div className="overflow-y-auto flex-1 mb-5 space-y-5 pr-3 sm:pr-0">
          {Object.entries(tags).map(([section, sectionTags]) => (
            <div
              key={section}
              className="rounded-lg border border-black overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 bg-black/5 border-b border-black/10">
                <span className="text-[12px] font-bold text-black tracking-widest">
                  {section}
                </span>
                <button
                  onClick={() => deleteSection(section)}
                  className="text-[14px] text-black/30 hover:text-reef-red cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="px-3 py-2 space-y-1.5">
                {Object.entries(sectionTags).map(([tag, color]) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm shrink-0"
                      style={{ background: color }}
                    />
                    <span
                      className="text-[12px] px-2 py-0.5 rounded"
                      style={{ background: color, color: C.cream }}
                    >
                      {tag}
                    </span>
                    <span className="text-[10px] text-black/30 font-mono flex-1">
                      {color.toUpperCase()}
                    </span>
                    <button
                      onClick={() => deleteTag(section, tag)}
                      className="text-[14px] text-black/25 hover:text-reef-red cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-1 pb-1 min-w-0">
                  <span
                    className="w-5 h-5 rounded border border-black shrink-0 inline-block"
                    style={{ background: newTagColor[section] || C.default }}
                  />
                  <input
                    className="w-19 h-7 border border-black text-[12px] px-2 outline-none bg-transparent font-mono shrink-0"
                    placeholder="#ABA8A3"
                    value={newTagColor[section] ?? ""}
                    onChange={(e) =>
                      setNewTagColor((p) => ({
                        ...p,
                        [section]: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                  <input
                    className="min-w-0 flex-1 h-7 border border-black text-[12px] px-2 outline-none bg-transparent"
                    value={newTagName[section] ?? ""}
                    onChange={(e) =>
                      setNewTagName((p) => ({
                        ...p,
                        [section]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTag(section);
                    }}
                  />
                  <button
                    onClick={() => addTag(section)}
                    className="text-[12px] px-2 h-7 bg-reef-red text-reef-cream rounded cursor-pointer hover:bg-reef-blue"
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 h-8 border border-black text-[12px] px-2 outline-none bg-transparent"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSection();
              }}
            />
            <button
              onClick={addSection}
              className="text-[12px] px-3 h-8 border border-reef-red text-reef-red rounded cursor-pointer hover:bg-reef-red hover:text-reef-cream"
            >
              + SECTION
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="text-[12px] px-3 h-8 bg-[#ABA8A3] text-reef-cream rounded cursor-pointer hover:bg-reef-blue"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="text-[12px] px-4 h-8 bg-reef-red text-reef-cream rounded cursor-pointer hover:bg-reef-blue"
            >
              SAVE TAGS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
