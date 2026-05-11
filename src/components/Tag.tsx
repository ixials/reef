import { TagSections } from "../gist";
import { C } from "../colors";

export function tagColor(tag: string, tagSections: TagSections): string {
  tag = tag.toLowerCase().trim();
  for (const tags of Object.values(tagSections)) {
    if (tags[tag]) return tags[tag];
  }
  return C.default;
}

interface TagProps {
  label: string;
  tagSections: TagSections;
  onRemove?: () => void;
}

export function Tag({ label, tagSections, onRemove }: TagProps) {
  const bg = tagColor(label, tagSections);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] text-reef-cream"
      style={{ background: bg }}
    >
      {label}
      {onRemove && (
        <span
          onClick={onRemove}
          className="cursor-pointer opacity-80 text-sm leading-none hover:opacity-100"
        >
          ×
        </span>
      )}
    </span>
  );
}
