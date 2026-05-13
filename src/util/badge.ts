import type { TagOption, TagRecord } from '../types.js';

export function resolveTagLabel(tagType: string, options: TagOption[]): string {
  return options.find((option) => option.id === tagType)?.label ?? tagType;
}

export function getStatusGlyph(tag: TagRecord): string {
  return tag.vouched ? '✅' : '⚪';
}

export function buildBadgeText(tag: TagRecord, options: TagOption[]): string {
  const label = resolveTagLabel(tag.tagType, options);
  return `${label} • ${tag.value}`;
}
