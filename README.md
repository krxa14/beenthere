# BeenThere

BeenThere is a Devvit hackathon app that helps Reddit highlight real lived experience with user context tags, mod vouches, and thread summaries.

## What It Does

Reddit's edge in the AI era is not just information. It is who is speaking from real experience.

BeenThere turns that signal into lightweight thread infrastructure:

- Users can tag their own post or comment with context like `Owner`, `Local resident`, or `Professional`.
- Moderators can vouch the strongest claims with one menu action.
- Threads with enough tagged replies get a stickied `Context Summary` that ranks vouched voices first.

Everything happens inside Reddit's native UI using menu items, forms, toasts, and comments. There is no custom web UI and no external API dependency.

## Why It Fits A Hackathon

- Solves a real Reddit-native problem: separating lived experience from generic advice.
- Uses Devvit primitives cleanly: menus, forms, settings, triggers, Redis, and scheduler jobs.
- Stays easy to trust: no AI detection, no identity verification, no off-platform calls.
- Feels at home on Reddit instead of layering on a foreign interface.

## Quick Product Flow

1. A user writes a comment or post that sounds like firsthand experience.
2. BeenThere gently nudges them to add a context tag.
3. The user opens the `...` menu and adds a short tag detail like `3 years` or `ICU nurse`.
4. A moderator can vouch the best claim.
5. Once the thread hits the threshold, the app posts or updates a stickied `Context Summary`.

## Why It Matters

This is designed for the kinds of communities where credibility matters most:

- Advice subs that need practitioner signal over generic summaries.
- Product and review subs that care whether someone actually owned or used the thing.
- Local communities where on-the-ground perspective matters more than polished consensus.

## Trust And Safety

- Voluntary only. Users tag their own content.
- No external API calls. `http` is disabled in [`devvit.json`](devvit.json).
- No identity claims or background verification.
- Mods stay in control of vouches and enabled tag types.

## Where The Code Is

If you landed here looking for the actual app code, it lives in [`src/`](src).

- Entry point: [`src/main.ts`](src/main.ts)
- Settings: [`src/settings.ts`](src/settings.ts)
- Forms: [`src/forms/tagForm.ts`](src/forms/tagForm.ts)
- Menus: [`src/menu/`](src/menu)
- Triggers: [`src/triggers/`](src/triggers)
- Storage helpers: [`src/storage/`](src/storage)
- Summary engine: [`src/summary/`](src/summary)
- Scheduler: [`src/scheduler/summaryRefresh.ts`](src/scheduler/summaryRefresh.ts)

## Architecture Notes

- `Redis` stores per-content tags, post tag indexes, nudged items, and summary comment IDs.
- `Triggers` watch new posts and comments for lightweight experience-keyword nudges.
- `Menu actions` keep tagging and moderation actions native to Reddit.
- `Scheduler jobs` batch summary refreshes to avoid noisy edit churn on active threads.

## Local Development

```bash
npm install
npm run build
```

This repo currently includes TypeScript validation for the app code. To run it end-to-end in Reddit, use the Devvit CLI in your own Devvit developer environment.

## Submission Angle

BeenThere is built for a hackathon, but the product idea is intentionally practical: a low-friction way to surface human credibility on Reddit without changing how Reddit feels.
