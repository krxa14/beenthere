import type { RedisClient, RedditAPIClient } from '@devvit/public-api';
import { DEFAULT_TAG_OPTIONS } from '../settings.js';
import { buildBadgeText, getStatusGlyph } from '../util/badge.js';
import type { TagRecord } from '../types.js';
import { getTargetSnapshot } from '../storage/tag.js';

type SummaryRenderContext = {
  reddit: Pick<RedditAPIClient, 'getCommentById' | 'getPostById'>;
  redis: Pick<RedisClient, 'hGetAll'>;
};

function pluralizeClaims(count: number): string {
  return count === 1 ? 'claim' : 'claims';
}

export async function renderSummary(context: SummaryRenderContext, tags: TagRecord[]): Promise<string> {
  const lines = await Promise.all(
    tags.map(async (tag) => {
      try {
        const target = await getTargetSnapshot(context, tag.contentId, tag.contentType);
        const username = target.deleted ? '[deleted user]' : `u/${tag.authorName}`;
        const author = tag.vouched ? `**${username}**` : username;
        const badge = buildBadgeText(tag, DEFAULT_TAG_OPTIONS);
        const jumpUrl = `https://reddit.com${target.permalink}`;
        return `${getStatusGlyph(tag)} ${author} — ${badge} · [jump](${jumpUrl})`;
      } catch (_error) {
        const username = tag.vouched ? '**[deleted user]**' : '[deleted user]';
        const badge = buildBadgeText(tag, DEFAULT_TAG_OPTIONS);
        return `${getStatusGlyph(tag)} ${username} — ${badge}`;
      }
    }),
  );

  return [
    `📋 **Context Summary** — ${tags.length} lived-experience ${pluralizeClaims(tags.length)} on this thread`,
    '',
    ...lines,
    '',
    '✅ = mod-vouched · ⚪ = self-declared · *Powered by BeenThere*',
  ].join('\n');
}
