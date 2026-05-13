import type { RedisClient, RedditAPIClient, SettingsClient } from '@devvit/public-api';
import { getStickySummary, getSummaryThreshold } from '../settings.js';
import { getPostTags } from '../storage/tag.js';
import { summaryKey } from '../storage/keys.js';
import { renderSummary } from './render.js';

type SummaryContext = {
  redis: Pick<RedisClient, 'get' | 'set' | 'del' | 'hGetAll' | 'zRange'>;
  reddit: Pick<RedditAPIClient, 'getCommentById' | 'getPostById' | 'submitComment'>;
  settings: Pick<SettingsClient, 'get'>;
};

export async function refreshSummary(context: SummaryContext, postId: string): Promise<void> {
  const tags = await getPostTags(context, postId);
  const threshold = await getSummaryThreshold(context);
  const summaryCommentId = await context.redis.get(summaryKey(postId));

  if (tags.length < threshold) {
    if (summaryCommentId) {
      try {
        const comment = await context.reddit.getCommentById(summaryCommentId);
        await comment.delete();
      } catch (_error) {
        // Ignore missing/deleted summary comments.
      }
      await context.redis.del(summaryKey(postId));
    }
    return;
  }

  const summaryText = await renderSummary(context, tags);
  const shouldSticky = await getStickySummary(context);

  if (summaryCommentId) {
    try {
      const existingComment = await context.reddit.getCommentById(summaryCommentId);
      if (existingComment.body !== summaryText) {
        await existingComment.edit({ text: summaryText });
      }
      if (shouldSticky && !existingComment.stickied) {
        await existingComment.distinguish(true);
      }
      return;
    } catch (_error) {
      await context.redis.del(summaryKey(postId));
    }
  }

  const newComment = await context.reddit.submitComment({
    id: postId,
    text: summaryText,
  });
  if (shouldSticky) {
    await newComment.distinguish(true);
  }
  await context.redis.set(summaryKey(postId), newComment.id);
}
