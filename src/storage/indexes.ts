import type { RedisClient } from '@devvit/public-api';
import { DIRTY_QUEUE_KEY, postTagsKey } from './keys.js';

type RedisIndexWriteContext = {
  redis: Pick<RedisClient, 'zAdd' | 'zRem'>;
};

type RedisIndexReadContext = {
  redis: Pick<RedisClient, 'zRange'>;
};

export async function addTagToPostIndex(
  context: RedisIndexWriteContext,
  postId: string,
  contentId: string,
  score: number,
): Promise<void> {
  await context.redis.zAdd(postTagsKey(postId), { member: contentId, score });
}

export async function removeTagFromPostIndex(
  context: RedisIndexWriteContext,
  postId: string,
  contentId: string,
): Promise<void> {
  await context.redis.zRem(postTagsKey(postId), [contentId]);
}

export async function getPostTagIds(context: RedisIndexReadContext, postId: string): Promise<string[]> {
  const entries = await context.redis.zRange(postTagsKey(postId), 0, -1);
  return entries.map((entry: { member: string }) => entry.member);
}

export async function markDirty(context: RedisIndexWriteContext, postId: string, dirtyAt = Date.now()): Promise<void> {
  await context.redis.zAdd(DIRTY_QUEUE_KEY, { member: postId, score: dirtyAt });
}

export async function getDueDirtyPosts(
  context: RedisIndexReadContext,
  cutoffMs: number,
  limit = 50,
): Promise<Array<{ postId: string; score: number }>> {
  const entries = await context.redis.zRange(DIRTY_QUEUE_KEY, 0, cutoffMs, {
    by: 'score',
    limit: { offset: 0, count: limit },
  });
  return entries.map((entry: { member: string; score: number }) => ({
    postId: entry.member,
    score: entry.score,
  }));
}

export async function clearDirtyPost(context: RedisIndexWriteContext, postId: string): Promise<void> {
  await context.redis.zRem(DIRTY_QUEUE_KEY, [postId]);
}
