# BeenThere

BeenThere is a Devvit moderation app that turns lived experience into a structured thread signal without leaving Reddit's native UI. Users add context tags to their own posts or comments, moderators can vouch the strongest claims, and qualifying threads get a stickied Context Summary.

## Product shape

- Native Reddit interaction only: menu items, forms, toasts, bot comments, and a stickied summary.
- No external API calls. `http` stays disabled in [devvit.json](</Users/pranav/Documents/New project/beenthere/devvit.json>).
- Per-comment or per-post context tags, not permanent user identity.
- Mod-vouched entries rank above self-declared entries in the summary.

## Core flows

1. A user writes a comment or post that matches experience keywords.
2. BeenThere replies with a lightweight nudge.
3. The user opens the `...` menu and chooses `BeenThere: Add context tag`.
4. A moderator can later choose `BeenThere: Vouch this context`.
5. Once the thread crosses the threshold, the app posts or updates a Context Summary.

## Local files

- Entry point: [src/main.ts](</Users/pranav/Documents/New project/beenthere/src/main.ts>)
- Settings: [src/settings.ts](</Users/pranav/Documents/New project/beenthere/src/settings.ts>)
- Menus and forms: [src/menu/addTag.ts](</Users/pranav/Documents/New project/beenthere/src/menu/addTag.ts>) and [src/forms/tagForm.ts](</Users/pranav/Documents/New project/beenthere/src/forms/tagForm.ts>)
- Triggers: [src/triggers/commentCreate.ts](</Users/pranav/Documents/New project/beenthere/src/triggers/commentCreate.ts>) and [src/triggers/postCreate.ts](</Users/pranav/Documents/New project/beenthere/src/triggers/postCreate.ts>)
- Summary engine: [src/summary/post.ts](</Users/pranav/Documents/New project/beenthere/src/summary/post.ts>) and [src/summary/render.ts](</Users/pranav/Documents/New project/beenthere/src/summary/render.ts>)

## Notes

- The app keeps the Reddit look and feel by avoiding custom blocks or webviews.
- The scheduler runs every minute and only refreshes posts whose dirty timestamp is older than the configured refresh interval.
- If a tag is edited, its vouch state resets so moderators can re-approve the updated claim.
