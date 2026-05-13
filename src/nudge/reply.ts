import type { RedisClient, RedditAPIClient } from '@devvit/public-api';
import { nudgedCommentKey, nudgedPostKey } from '../storage/keys.js';

const NUDGE_TTL_SECONDS = 7 * 24 * 60 * 60;

const NUDGE_TEXT =
  '🪪 *Looks like lived experience.* Tap the **⋯** menu on this comment → **BeenThere: Add context tag** to help others find your voice.';

const POST_NUDGE_TEXT =
  '🪪 *Looks like lived experience.* Tap the **⋯** menu on this post → **BeenThere: Add context tag** to help others find your voice.';

type NudgeReplyContext = {
  redis: Pick<RedisClient, 'get' | 'set' | 'expire'>;
  reddit: Pick<RedditAPIClient, 'submitComment'>;
};

export async function replyToNudgeComment(context: NudgeReplyContext, commentId: string): Promise<void> {
  const key = nudgedCommentKey(commentId);
  const already = await context.redis.get(key);
  if (already) {
    return;
  }

  await context.redis.set(key, '1');
  await context.redis.expire(key, NUDGE_TTL_SECONDS);
  await context.reddit.submitComment({
    id: commentId,
    text: NUDGE_TEXT,
  });
}

export async function replyToNudgePost(context: NudgeReplyContext, postId: string): Promise<void> {
  const key = nudgedPostKey(postId);
  const already = await context.redis.get(key);
  if (already) {
    return;
  }

  await context.redis.set(key, '1');
  await context.redis.expire(key, NUDGE_TTL_SECONDS);
  await context.reddit.submitComment({
    id: postId,
    text: POST_NUDGE_TEXT,
  });
}
