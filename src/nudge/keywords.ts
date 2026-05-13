import type { SettingsClient } from '@devvit/public-api';
import { getKeywords, getNegativeKeywords } from '../settings.js';
import { hasMinimumMeaningfulLength, normalizePlainText } from '../util/parse.js';

type NudgeKeywordContext = {
  settings: Pick<SettingsClient, 'get'>;
};

export async function matchKeyword(context: NudgeKeywordContext, body: string): Promise<string | null> {
  if (!hasMinimumMeaningfulLength(body)) {
    return null;
  }

  const normalized = normalizePlainText(body);
  const negatives = await getNegativeKeywords(context);
  if (negatives.some((negative) => normalized.includes(negative))) {
    return null;
  }

  const keywords = await getKeywords(context);
  return keywords.find((keyword) => normalized.includes(keyword)) ?? null;
}
