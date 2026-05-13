import { Devvit } from '@devvit/public-api';
import type { Context } from '@devvit/public-api';
import { getEnabledTags } from '../settings.js';
import { deleteTag, getTag, getTargetSnapshot, writeTag } from '../storage/tag.js';
import type { TagFormData, TagRecord } from '../types.js';
import { sanitizeTagValue } from '../util/parse.js';

const PENDING_TAG_FORM_TTL_SECONDS = 10 * 60;

function expiryFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function buildTagOptions(data: TagFormData): Array<{ label: string; value: string }> {
  if (!data.currentTag) {
    return data.enabledTags.map((tag) => ({ label: tag.label, value: tag.id }));
  }

  const currentExists = data.enabledTags.some((tag) => tag.id === data.currentTag?.tagType);
  const options: Array<{ label: string; value: string }> = data.enabledTags.map((tag) => ({
    label: tag.label,
    value: tag.id,
  }));

  if (!currentExists && data.currentTag.tagType) {
    options.unshift({
      label: `${data.currentTag.tagType} (disabled for new tags)`,
      value: data.currentTag.tagType,
    });
  }

  return options;
}

async function pendingStateKey(context: Context, formKind: 'add' | 'edit'): Promise<string | undefined> {
  if (context.userId) {
    return `form:${formKind}:${context.userId}`;
  }

  const username = await context.reddit.getCurrentUsername();
  return username ? `form:${formKind}:${username}` : undefined;
}

async function storePendingFormState(context: Context, formKind: 'add' | 'edit', data: TagFormData): Promise<void> {
  const key = await pendingStateKey(context, formKind);
  if (!key) {
    return;
  }

  await context.redis.set(key, JSON.stringify(data), {
    expiration: expiryFromNow(PENDING_TAG_FORM_TTL_SECONDS),
  });
}

async function consumePendingFormState(context: Context, formKind: 'add' | 'edit'): Promise<TagFormData | undefined> {
  const key = await pendingStateKey(context, formKind);
  if (!key) {
    return undefined;
  }

  const raw = await context.redis.get(key);
  if (!raw) {
    return undefined;
  }

  await context.redis.del(key);
  return JSON.parse(raw) as TagFormData;
}

async function upsertTagFromForm(
  context: Context,
  state: TagFormData,
  values: { tagType: string[]; value: string },
): Promise<boolean> {
  const currentUser = await context.reddit.getCurrentUser();
  if (!currentUser?.username) {
    context.ui.showToast({ text: 'You must be logged in to tag content.', appearance: 'neutral' });
    return false;
  }

  const target = await getTargetSnapshot(context, state.targetId, state.targetType);
  if (target.deleted) {
    context.ui.showToast({ text: 'Deleted content cannot be tagged.', appearance: 'neutral' });
    return false;
  }

  if (target.authorName !== currentUser.username) {
    context.ui.showToast({ text: 'Only own posts can be tagged.', appearance: 'neutral' });
    return false;
  }

  const selectedTagType = values.tagType[0] ?? '';
  const existingTag = await getTag(context, state.targetId);
  const allowedTagTypes = new Set<string>(state.enabledTags.map((tag) => tag.id));
  if (existingTag?.tagType) {
    allowedTagTypes.add(existingTag.tagType);
  }

  if (!selectedTagType || !allowedTagTypes.has(selectedTagType)) {
    context.ui.showToast({ text: 'That tag type is no longer available.', appearance: 'neutral' });
    return false;
  }

  const sanitizedValue = sanitizeTagValue(values.value);
  if (!sanitizedValue) {
    context.ui.showToast({ text: 'Add a short detail for the tag.', appearance: 'neutral' });
    return false;
  }

  const now = Date.now();

  const tag: TagRecord = {
    contentId: state.targetId,
    contentType: state.targetType,
    postId: target.postId,
    authorName: currentUser.username,
    authorId: currentUser.id ?? '',
    tagType: selectedTagType,
    value: sanitizedValue,
    vouched: false,
    vouchedBy: null,
    vouchedAt: null,
    ts: existingTag?.ts ?? now,
  };

  await writeTag(context, tag);
  return true;
}

export const addTagForm = Devvit.createForm(
  (rawData) => {
    const data = rawData as TagFormData;
    return {
      title: 'BeenThere: Add context',
      fields: [
        {
          name: 'tagType',
          label: 'What kind of context?',
          type: 'select',
          options: buildTagOptions(data),
          required: true,
        },
        {
          name: 'value',
          label: 'Detail (e.g. duration, location, role)',
          type: 'string',
          maxLength: 60,
          required: true,
          helpText: 'Examples: "3 years", "11th arr. Paris", "ICU nurse"',
        },
      ],
      acceptLabel: 'Tag',
    };
  },
  async (event, context) => {
    const state = await consumePendingFormState(context, 'add');
    if (!state) {
      context.ui.showToast({ text: 'Tag form expired. Please reopen it.', appearance: 'neutral' });
      return;
    }

    const didSave = await upsertTagFromForm(context, state, {
      tagType: Array.isArray(event.values.tagType)
        ? event.values.tagType.map(String)
        : [String(event.values.tagType)],
      value: String(event.values.value),
    });
    if (didSave) {
      context.ui.showToast({ text: 'Tag added. Mods can vouch.', appearance: 'success' });
    }
  },
);

export const editTagForm = Devvit.createForm(
  (rawData) => {
    const data = rawData as TagFormData;
    return {
      title: 'BeenThere: Edit or remove context',
      fields: [
        {
          name: 'tagType',
          label: 'What kind of context?',
          type: 'select',
          options: buildTagOptions(data),
          defaultValue: data.currentTag ? [data.currentTag.tagType] : undefined,
          required: true,
        },
        {
          name: 'value',
          label: 'Detail',
          type: 'string',
          maxLength: 60,
          defaultValue: data.currentTag?.value ?? '',
          required: true,
        },
        {
          name: 'removeTag',
          label: 'Remove this tag instead',
          type: 'boolean',
          defaultValue: false,
        },
      ],
      acceptLabel: 'Save',
    };
  },
  async (event, context) => {
    const state = await consumePendingFormState(context, 'edit');
    if (!state) {
      context.ui.showToast({ text: 'Edit form expired. Please reopen it.', appearance: 'neutral' });
      return;
    }

    const shouldRemove = Boolean(event.values.removeTag);

    if (shouldRemove) {
      const currentUser = await context.reddit.getCurrentUsername();
      const existingTag = await getTag(context, state.targetId);
      if (!currentUser || !existingTag || existingTag.authorName !== currentUser) {
        context.ui.showToast({ text: 'No tag to edit.', appearance: 'neutral' });
        return;
      }

      await deleteTag(context, state.targetId);
      context.ui.showToast({ text: 'Tag removed.', appearance: 'success' });
      return;
    }

    const didSave = await upsertTagFromForm(context, state, {
      tagType: Array.isArray(event.values.tagType)
        ? event.values.tagType.map(String)
        : [String(event.values.tagType)],
      value: String(event.values.value),
    });
    if (didSave) {
      context.ui.showToast({ text: 'Tag updated. Mods can re-vouch it.', appearance: 'success' });
    }
  },
);

export async function buildTagFormData(
  context: Context,
  targetId: string,
  targetType: TagFormData['targetType'],
): Promise<TagFormData> {
  const enabledTags = await getEnabledTags(context);
  const currentTag = await getTag(context, targetId);

  return {
    targetId,
    targetType,
    enabledTags,
    currentTag: currentTag ?? null,
  };
}

export async function openAddTagForm(context: Context, data: TagFormData): Promise<void> {
  await storePendingFormState(context, 'add', data);
  context.ui.showForm(addTagForm, data);
}

export async function openEditTagForm(context: Context, data: TagFormData): Promise<void> {
  await storePendingFormState(context, 'edit', data);
  context.ui.showForm(editTagForm, data);
}
