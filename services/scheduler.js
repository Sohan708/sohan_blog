import cron from 'node-cron';
import { publishScheduledPosts } from './publishService.js';

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  cron.schedule('* * * * *', async () => {
    try {
      await publishScheduledPosts();
    } catch (error) {
      console.error('Scheduler error', error.message);
    }
  });
}

