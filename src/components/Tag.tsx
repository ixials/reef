import { TAG_PALETTE } from "../colors";

export function tagColor(tag: string): string {
  tag = tag.toLowerCase().trim();
  return TAG_PALETTE[tag] || "#ABA8A3";
}

interface TagProps {
  label: string;
  onRemove?: () => void;
}

export function Tag({ label, onRemove }: TagProps) {
  const bg = tagColor(label);
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
