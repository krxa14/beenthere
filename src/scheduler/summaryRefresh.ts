import { Devvit } from '@devvit/public-api';
import type { RedisClient, Scheduler, TriggerContext } from '@devvit/public-api';
import { getSummaryRefreshSec } from '../settings.js';
import { clearDirtyPost, getDueDirtyPosts } from '../storage/indexes.js';
import { REFRESH_JOB_ID_KEY } from '../storage/keys.js';
import { refreshSummary } from '../summary/post.js';

const SUMMARY_JOB_NAME = 'beenthere_refresh';

type EnsureJobContext = Pick<TriggerContext, 'redis' | 'scheduler'> & {
  redis: Pick<RedisClient, 'get' | 'set'>;
  scheduler: Pick<Scheduler, 'cancelJob' | 'runJob'>;
};

async function ensureSummaryJob(context: EnsureJobContext): Promise<void> {
  const existingJobId = await context.redis.get(REFRESH_JOB_ID_KEY);
  if (existingJobId) {
    try {
      await context.scheduler.cancelJob(existingJobId);
    } catch (_error) {
      // Ignore stale job IDs.
    }
  }

  const jobId = await context.scheduler.runJob({
    name: SUMMARY_JOB_NAME,
    cron: '* * * * *',
  });
  await context.redis.set(REFRESH_JOB_ID_KEY, jobId);
}

Devvit.addSchedulerJob({
  name: SUMMARY_JOB_NAME,
  onRun: async (_event, context) => {
    const refreshSec = await getSummaryRefreshSec(context);
    const cutoff = Date.now() - refreshSec * 1000;
    const duePosts = await getDueDirtyPosts(context, cutoff, 50);

    for (const { postId } of duePosts) {
      try {
        await refreshSummary(context, postId);
        await clearDirtyPost(context, postId);
      } catch (error) {
        console.error(`refresh failed ${postId}`, error);
      }
    }
  },
});

Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_event, context) => {
    await ensureSummaryJob(context);
  },
});

Devvit.addTrigger({
  event: 'AppUpgrade',
  onEvent: async (_event, context) => {
    await ensureSummaryJob(context);
  },
});
