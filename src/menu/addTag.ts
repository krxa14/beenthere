import { Devvit } from '@devvit/public-api';
import { buildTagFormData, openAddTagForm } from '../forms/tagForm.js';
import { resolveTargetFromMenuEvent } from '../storage/tag.js';

Devvit.addMenuItem({
  location: ['comment', 'post'],
  label: 'BeenThere: Add context tag',
  onPress: async (event, context) => {
    const username = await context.reddit.getCurrentUsername();
    if (!username) {
      context.ui.showToast({ text: 'You must be logged in to tag content.', appearance: 'neutral' });
      return;
    }

    const target = await resolveTargetFromMenuEvent(context, event);
    if (target.authorName !== username) {
      context.ui.showToast({ text: 'Only own posts can be tagged.', appearance: 'neutral' });
      return;
    }

    const targetType = event.location === 'comment' ? 'comment' : 'post';
    const data = await buildTagFormData(context, event.targetId, targetType);
    if (data.enabledTags.length === 0) {
      context.ui.showToast({ text: 'No tag types are enabled in this subreddit.', appearance: 'neutral' });
      return;
    }

    await openAddTagForm(context, data);
  },
});
