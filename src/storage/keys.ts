export const DIRTY_QUEUE_KEY = 'dirty:queue';
export const REFRESH_JOB_ID_KEY = 'app:refresh-job-id';

export function tagKey(contentId: string): string {
  return `tag:${contentId}`;
}

export function postTagsKey(postId: string): string {
  return `post:${postId}:tags`;
}

export function nudgedCommentKey(commentId: string): string {
  return `nudged:${commentId}`;
}

export function nudgedPostKey(postId: string): string {
  return `nudged:post:${postId}`;
}

export function summaryKey(postId: string): string {
  return `summary:${postId}`;
}
