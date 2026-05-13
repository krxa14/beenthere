import { Devvit } from '@devvit/public-api';
import { getTag, unvouchTag } from '../storage/tag.js';

Devvit.addMenuItem({
  location: ['comment', 'post'],
  forUserType: 'moderator',
  label: 'BeenThere: Remove vouch',
  onPress: async (event, context) => {
    const existing = await getTag(context, event.targetId);
    if (!existing) {
      context.ui.showToast({ text: 'No tag on this item.', appearance: 'neutral' });
      return;
    }

    if (!existing.vouched) {
      context.ui.showToast({ text: 'Tag is not vouched.', appearance: 'neutral' });
      return;
    }

    await unvouchTag(context, event.targetId);
    context.ui.showToast({ text: 'Vouch removed.', appearance: 'success' });
  },
});
