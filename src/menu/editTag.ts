import { Devvit } from '@devvit/public-api';
import { buildTagFormData, openEditTagForm } from '../forms/tagForm.js';
import { getTag } from '../storage/tag.js';

Devvit.addMenuItem({
  location: ['comment', 'post'],
  label: 'BeenThere: Edit/remove tag',
  onPress: async (event, context) => {
    const username = await context.reddit.getCurrentUsername();
    if (!username) {
      context.ui.showToast({ text: 'You must be logged in to edit tags.', appearance: 'neutral' });
      return;
    }

    const tag = await getTag(context, event.targetId);
    if (!tag || tag.authorName !== username) {
      context.ui.showToast({ text: 'No tag to edit.', appearance: 'neutral' });
      return;
    }

    const targetType = event.location === 'comment' ? 'comment' : 'post';
    const data = await buildTagFormData(context, event.targetId, targetType);
    await openEditTagForm(context, data);
  },
});
