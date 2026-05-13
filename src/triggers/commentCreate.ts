import { Devvit } from '@devvit/public-api';
import { matchKeyword } from '../nudge/keywords.js';
import { replyToNudgeComment } from '../nudge/reply.js';

Devvit.addTrigger({
  event: 'CommentCreate',
  onEvent: async (event, context) => {
    const body = event.comment?.body;
    const authorName = event.author?.name;
    if (!body || !authorName) {
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
    if (!match || !event.comment?.id) {
      return;
    }

    await replyToNudgeComment(context, event.comment.id);
  },
});
