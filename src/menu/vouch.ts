import { Devvit } from '@devvit/public-api';
import { getTag, vouchTag } from '../storage/tag.js';

Devvit.addMenuItem({
  location: ['comment', 'post'],
  forUserType: 'moderator',
  label: 'BeenThere: Vouch this context',
  onPress: async (event, context) => {
    const existing = await getTag(context, event.targetId);
    if (!existing) {
      context.ui.showToast({ text: 'No tag on this item.', appearance: 'neutral' });
      return;
    }

    if (existing.vouched) {
      context.ui.showToast({ text: 'Already vouched.', appearance: 'neutral' });
      return;
    }

    const tag = await vouchTag(context, event.targetId, (await context.reddit.getCurrentUsername()) ?? 'unknown_mod');
    if (!tag) {
      context.ui.showToast({ text: 'No tag on this item.', appearance: 'neutral' });
      return;
    }

    context.ui.showToast({ text: 'Vouched. Tag is now gold.', appearance: 'success' });
  },
});
