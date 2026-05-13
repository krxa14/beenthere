import type { MenuItemOnPressEvent, RedisClient, RedditAPIClient } from '@devvit/public-api';
import type { ContentType, TagRecord, TargetSnapshot } from '../types.js';
import { addTagToPostIndex, getPostTagIds, markDirty, removeTagFromPostIndex } from './indexes.js';
import { tagKey } from './keys.js';

type ReadTagContext = {
  redis: Pick<RedisClient, 'hGetAll'>;
  reddit: Pick<RedditAPIClient, 'getCommentById' | 'getPostById'>;
};

type MutableStorageContext = ReadTagContext & {
  redis: Pick<RedisClient, 'hSet' | 'hGetAll' | 'del' | 'zAdd' | 'zRem'>;
};

function serializeTagRecord(tag: TagRecord): Record<string, string> {
  return {
    contentId: tag.contentId,
    contentType: tag.contentType,
    postId: tag.postId,
    authorName: tag.authorName,
    authorId: tag.authorId,
    tagType: tag.tagType,
    value: tag.value,
    vouched: String(tag.vouched),
    vouchedBy: tag.vouchedBy ?? '',
    vouchedAt: tag.vouchedAt ? String(tag.vouchedAt) : '',
    ts: String(tag.ts),
  };
}

function deserializeTagRecord(record: Record<string, string>): TagRecord | undefined {
  if (!record.contentId || !record.contentType || !record.postId || !record.authorName) {
    return undefined;
  }

  return {
    contentId: record.contentId,
    contentType: record.contentType as ContentType,
    postId: record.postId,
    authorName: record.authorName,
    authorId: record.authorId,
    tagType: record.tagType,
    value: record.value,
    vouched: record.vouched === 'true',
    vouchedBy: record.vouchedBy || null,
    vouchedAt: record.vouchedAt ? Number(record.vouchedAt) : null,
    ts: Number(record.ts || Date.now()),
  };
}

export async function writeTag(context: MutableStorageContext, tag: TagRecord): Promise<void> {
  await context.redis.hSet(tagKey(tag.contentId), serializeTagRecord(tag));
  await addTagToPostIndex(context, tag.postId, tag.contentId, tag.ts);
  await markDirty(context, tag.postId);
}

export async function getTag(context: ReadTagContext, contentId: string): Promise<TagRecord | undefined> {
  const record = await context.redis.hGetAll(tagKey(contentId));
  return deserializeTagRecord(record);
}

export async function deleteTag(context: MutableStorageContext, contentId: string): Promise<TagRecord | undefined> {
  const existing = await getTag(context, contentId);
  if (!existing) {
    return undefined;
  }

  await context.redis.del(tagKey(contentId));
  await removeTagFromPostIndex(context, existing.postId, contentId);
  await markDirty(context, existing.postId);
  return existing;
}

export async function vouchTag(context: MutableStorageContext, contentId: string, moderatorName: string): Promise<TagRecord | undefined> {
  const existing = await getTag(context, contentId);
  if (!existing) {
    return undefined;
  }

  const updated: TagRecord = {
    ...existing,
    vouched: true,
    vouchedBy: moderatorName,
    vouchedAt: Date.now(),
  };
  await writeTag(context, updated);
  return updated;
}

export async function unvouchTag(context: MutableStorageContext, contentId: string): Promise<TagRecord | undefined> {
  const existing = await getTag(context, contentId);
  if (!existing) {
    return undefined;
  }

  const updated: TagRecord = {
    ...existing,
    vouched: false,
    vouchedBy: null,
    vouchedAt: null,
  };
  await writeTag(context, updated);
  return updated;
}

export async function getPostTags(
  context: ReadTagContext & { redis: Pick<RedisClient, 'hGetAll' | 'zRange'> },
  postId: string,
): Promise<TagRecord[]> {
  const ids = await getPostTagIds(context, postId);
  const tags = await Promise.all(ids.map((id) => getTag(context, id)));

  return tags
    .filter((tag): tag is TagRecord => Boolean(tag))
    .sort((left, right) => {
      if (left.vouched !== right.vouched) {
        return left.vouched ? -1 : 1;
      }
      return right.ts - left.ts;
    });
}

export async function resolveTargetFromMenuEvent(
  context: ReadTagContext,
  event: MenuItemOnPressEvent,
): Promise<TargetSnapshot> {
  if (event.location === 'comment') {
    const comment = await context.reddit.getCommentById(event.targetId);
    return {
      id: comment.id,
      contentType: 'comment',
      postId: comment.postId,
      authorName: comment.authorName,
      authorId: comment.authorId ?? '',
      body: comment.body,
      permalink: comment.permalink,
      deleted: comment.authorName === '[deleted]' || comment.removed,
    };
  }

  const post = await context.reddit.getPostById(event.targetId);
  return {
    id: post.id,
    contentType: 'post',
    postId: post.id,
    authorName: post.authorName,
    authorId: post.authorId ?? '',
    body: post.body ?? '',
    permalink: post.permalink,
    deleted: post.authorName === '[deleted]' || post.removed,
  };
}

export async function getTargetSnapshot(
  context: ReadTagContext,
  contentId: string,
  contentType: ContentType,
): Promise<TargetSnapshot> {
  if (contentType === 'comment') {
    const comment = await context.reddit.getCommentById(contentId);
    return {
      id: comment.id,
      contentType: 'comment',
      postId: comment.postId,
      authorName: comment.authorName,
      authorId: comment.authorId ?? '',
      body: comment.body,
      permalink: comment.permalink,
      deleted: comment.authorName === '[deleted]' || comment.removed,
    };
  }

  const post = await context.reddit.getPostById(contentId);
  return {
    id: post.id,
    contentType: 'post',
    postId: post.id,
    authorName: post.authorName,
    authorId: post.authorId ?? '',
    body: post.body ?? '',
    permalink: post.permalink,
    deleted: post.authorName === '[deleted]' || post.removed,
  };
}
