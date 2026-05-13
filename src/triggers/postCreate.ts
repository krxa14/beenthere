import { Devvit } from '@devvit/public-api';
import { matchKeyword } from '../nudge/keywords.js';
import { replyToNudgePost } from '../nudge/reply.js';

Devvit.addTrigger({
  event: 'PostCreate',
  onEvent: async (event, context) => {
    const body = event.post?.selftext;
    const authorName = event.author?.name;
    if (!body || !authorName || !event.post?.id) {
      return;
    }

    const appUser = await context.reddit.getAppUser();
    if (authorName === appUser.username) {
      return;
    }

    const nudgeEnabled = (await context.settings.get<boolean>('nudgeEnabled')) ?? true;
    if (!nudgeEnabled) {
      return;
    }

    const match = await matchKeyword(context, body);
    if (!match) {
      return;
    }

    await replyToNudgePost(context, event.post.id);
  },
});
