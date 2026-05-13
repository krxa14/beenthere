import { Devvit } from '@devvit/public-api';
import type { SettingsClient } from '@devvit/public-api';
import type { TagOption, TagTypeId } from './types.js';
import { parseLineList } from './util/parse.js';

type SettingsContext = {
  settings: Pick<SettingsClient, 'get'>;
};

export const DEFAULT_KEYWORDS = [
  'i owned',
  "i've owned",
  'i lived in',
  "i've lived",
  'i work as',
  "i'm a",
  'im a',
  'in my',
  'i tried',
  'i bought',
  'i used',
  'as a',
  'i did this',
];

export const DEFAULT_NEGATIVE_KEYWORDS = [
  'i lived in fear',
  'i lived through',
  'in my dreams',
];

export const DEFAULT_TAG_OPTIONS: TagOption[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'tried', label: 'Tried it' },
  { id: 'local', label: 'Local resident' },
  { id: 'pro', label: 'Professional' },
  { id: 'regret', label: 'Did this / regretted' },
  { id: 'current', label: 'Current student/employee' },
  { id: 'recent_buyer', label: 'Recent buyer' },
];

export const DEFAULT_ENABLED_TAGS: TagTypeId[] = ['owner', 'tried', 'local', 'pro'];

export const DEFAULT_SUMMARY_THRESHOLD = 3;
export const DEFAULT_SUMMARY_REFRESH_SEC = 60;
export const MIN_SUMMARY_REFRESH_SEC = 60;
export const MAX_SUMMARY_REFRESH_SEC = 3600;

Devvit.addSettings([
  {
    type: 'boolean',
    name: 'nudgeEnabled',
    label: 'Enable keyword nudges',
    defaultValue: true,
  },
  {
    type: 'paragraph',
    name: 'keywords',
    label: 'Nudge keywords (one per line)',
    defaultValue: DEFAULT_KEYWORDS.join('\n'),
  },
  {
    type: 'paragraph',
    name: 'negativeKeywords',
    label: 'False-positive exclusions',
    defaultValue: DEFAULT_NEGATIVE_KEYWORDS.join('\n'),
  },
  {
    type: 'select',
    name: 'enabledTags',
    label: 'Enabled tag types',
    multiSelect: true,
    options: DEFAULT_TAG_OPTIONS.map((tag) => ({ label: tag.label, value: tag.id })),
    defaultValue: DEFAULT_ENABLED_TAGS,
  },
  {
    type: 'number',
    name: 'summaryThreshold',
    label: 'Min tags to show summary',
    defaultValue: DEFAULT_SUMMARY_THRESHOLD,
    onValidate: ({ value }) => (value !== undefined && (value < 2 || value > 10) ? '2-10' : undefined),
  },
  {
    type: 'number',
    name: 'summaryRefreshSec',
    label: 'Summary refresh interval (sec)',
    defaultValue: DEFAULT_SUMMARY_REFRESH_SEC,
    onValidate: ({ value }) =>
      value !== undefined && (value < MIN_SUMMARY_REFRESH_SEC || value > MAX_SUMMARY_REFRESH_SEC)
        ? `${MIN_SUMMARY_REFRESH_SEC}-${MAX_SUMMARY_REFRESH_SEC}`
        : undefined,
  },
  {
    type: 'boolean',
    name: 'stickySummary',
    label: 'Sticky the Context Summary',
    defaultValue: true,
  },
]);

export async function getKeywords(context: SettingsContext): Promise<string[]> {
  const raw = await context.settings.get<string>('keywords');
  return parseLineList(raw, DEFAULT_KEYWORDS);
}

export async function getNegativeKeywords(context: SettingsContext): Promise<string[]> {
  const raw = await context.settings.get<string>('negativeKeywords');
  return parseLineList(raw, DEFAULT_NEGATIVE_KEYWORDS);
}

export async function getEnabledTags(context: SettingsContext): Promise<TagOption[]> {
  const raw = await context.settings.get<string[]>('enabledTags');
  const enabledIds = raw ? new Set(raw) : new Set(DEFAULT_ENABLED_TAGS);
  return DEFAULT_TAG_OPTIONS.filter((option) => enabledIds.has(option.id));
}

export async function getSummaryThreshold(context: SettingsContext): Promise<number> {
  return (await context.settings.get<number>('summaryThreshold')) ?? DEFAULT_SUMMARY_THRESHOLD;
}

export async function getSummaryRefreshSec(context: SettingsContext): Promise<number> {
  const raw = (await context.settings.get<number>('summaryRefreshSec')) ?? DEFAULT_SUMMARY_REFRESH_SEC;
  return Math.min(MAX_SUMMARY_REFRESH_SEC, Math.max(MIN_SUMMARY_REFRESH_SEC, raw));
}

export async function getStickySummary(context: SettingsContext): Promise<boolean> {
  return (await context.settings.get<boolean>('stickySummary')) ?? true;
}
