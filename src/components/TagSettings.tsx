import { useState } from "react";

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

export function TagSettings({ customTags, onSave, onClose }: Props) {
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
      <div
        className="bg-[#E7E4DE] p-7 rounded-xl border-2 border-[#E84832] flex flex-col"
        style={{ width: 520, maxHeight: "80vh" }}
      >
        <h2
          className="mb-2 text-[34px] text-[#E84832] tracking-[0.1em]"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          tag settings{" "}
        </h2>

        <div className="overflow-y-auto flex-1 mb-5 space-y-5">
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
                  className="text-[14px] text-black/30 hover:text-[#E84832] cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="px-3 py-2 space-y-1.5">
                {Object.entries(sectionTags).map(([tag, color]) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span
                      className="text-[12px] px-2 py-0.5 rounded"
                      style={{ background: color, color: "#E7E4DE" }}
                    >
                      {tag}
                    </span>
                    <span className="text-[10px] text-black/30 font-mono flex-1">
                      {color}
                    </span>
                    <button
                      onClick={() => deleteTag(section, tag)}
                      className="text-[14px] text-black/25 hover:text-[#E84832] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-1 pb-1">
                  <span
                    className="w-5 h-5 rounded border border-black flex-shrink-0 inline-block"
                    style={{ background: newTagColor[section] || "#ABA8A3" }}
                  />
                  <input
                    className="w-[76px] h-[28px] border border-black text-[12px] px-2 outline-none bg-transparent font-mono flex-shrink-0"
                    placeholder="#ABA8A3"
                    value={newTagColor[section] ?? ""}
                    onChange={(e) =>
                      setNewTagColor((p) => ({
                        ...p,
                        [section]: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="flex-1 h-[28px] border border-black text-[12px] px-2 outline-none bg-transparent"
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
                    className="text-[12px] px-2 h-[28px] bg-[#E84832] text-[#E7E4DE] rounded cursor-pointer hover:bg-[#4A90D9]"
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
              className="flex-1 h-[32px] border border-black text-[12px] px-2 outline-none bg-transparent"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSection();
              }}
            />
            <button
              onClick={addSection}
              className="text-[12px] px-3 h-[32px] border border-[#E84832] text-[#E84832] rounded cursor-pointer hover:bg-[#E84832] hover:text-[#E7E4DE]"
            >
              + SECTION
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="text-[12px] px-3 h-[32px] bg-[#ABA8A3] text-[#E7E4DE] rounded cursor-pointer hover:bg-[#4A90D9]"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="text-[12px] px-4 h-[32px] bg-[#E84832] text-[#E7E4DE] rounded cursor-pointer hover:bg-[#4A90D9]"
            >
              SAVE TAGS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
