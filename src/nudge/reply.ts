import type { RedisClient, RedditAPIClient } from '@devvit/public-api';
import { nudgedCommentKey, nudgedPostKey } from '../storage/keys.js';

const NUDGE_TTL_SECONDS = 7 * 24 * 60 * 60;
const NUDGE_LOCK_TTL_SECONDS = 5 * 60;

const NUDGE_TEXT =
  '🪪 *Looks like lived experience.* Tap the **⋯** menu on this comment → **BeenThere: Add context tag** to help others find your voice.';

const POST_NUDGE_TEXT =
  '🪪 *Looks like lived experience.* Tap the **⋯** menu on this post → **BeenThere: Add context tag** to help others find your voice.';

type NudgeReplyContext = {
  redis: Pick<RedisClient, 'del' | 'get' | 'set'>;
  reddit: Pick<RedditAPIClient, 'submitComment'>;
};

function expiryFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

async function withNudgeLock(
  context: NudgeReplyContext,
  finalKey: string,
  submit: () => Promise<void>,
): Promise<void> {
  const alreadyNudged = await context.redis.get(finalKey);
  if (alreadyNudged) {
    return;
  }

  const lockKey = `${finalKey}:lock`;
  const lockReply = await context.redis.set(lockKey, '1', {
    nx: true,
    expiration: expiryFromNow(NUDGE_LOCK_TTL_SECONDS),
  });

  if (!lockReply) {
    return;
  }

  try {
    await submit();
    await context.redis.set(finalKey, '1', {
      expiration: expiryFromNow(NUDGE_TTL_SECONDS),
    });
  } finally {
    await context.redis.del(lockKey);
  }
}

export async function replyToNudgeComment(context: NudgeReplyContext, commentId: string): Promise<void> {
  await withNudgeLock(context, nudgedCommentKey(commentId), async () => {
    await context.reddit.submitComment({
      id: commentId,
      text: NUDGE_TEXT,
    });
  });
}

export async function replyToNudgePost(context: NudgeReplyContext, postId: string): Promise<void> {
  await withNudgeLock(context, nudgedPostKey(postId), async () => {
    await context.reddit.submitComment({
      id: postId,
      text: POST_NUDGE_TEXT,
    });
  });
}
