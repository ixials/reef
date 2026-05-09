import { TagSections } from "../gist";

export function tagColor(tag: string, tagSections: TagSections): string {
  tag = tag.toLowerCase().trim();
  for (const tags of Object.values(tagSections)) {
    if (tags[tag]) return tags[tag];
  }
  return "#ABA8A3";
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
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] text-[#E7E4DE]"
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
