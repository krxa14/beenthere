import type { JSONObject } from '@devvit/public-api';

export type ContentType = 'comment' | 'post';

export type TagTypeId =
  | 'owner'
  | 'tried'
  | 'local'
  | 'pro'
  | 'regret'
  | 'current'
  | 'recent_buyer';

export interface TagOption extends JSONObject {
  id: TagTypeId;
  label: string;
}

export interface TagRecord extends JSONObject {
  contentId: string;
  contentType: ContentType;
  postId: string;
  authorName: string;
  authorId: string;
  tagType: string;
  value: string;
  vouched: boolean;
  vouchedBy: string | null;
  vouchedAt: number | null;
  ts: number;
}

export interface TagFormData extends JSONObject {
  targetId: string;
  targetType: ContentType;
  enabledTags: TagOption[];
  currentTag: TagRecord | null;
}

export interface TargetSnapshot extends JSONObject {
  id: string;
  contentType: ContentType;
  postId: string;
  authorName: string;
  authorId: string;
  body: string;
  permalink: string;
  deleted: boolean;
}
