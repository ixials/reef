import { useState, useCallback } from "react";
import {
  TagSections,
  loadCustomTags,
  saveCustomTags,
} from "./components/TagSettings";

export function useTags() {
  const [customTags, setCustomTags] = useState<TagSections>(loadCustomTags);

  const updateCustomTags = useCallback((next: TagSections) => {
    saveCustomTags(next);
    setCustomTags(next);
  }, []);

  return { customTags, mergedTagSections: customTags, updateCustomTags };
}
