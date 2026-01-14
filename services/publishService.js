import Post from '../models/Post.js';
import { emitPublishEvent } from './webhookService.js';

export async function publishPost(post) {
  post.status = 'published';
  post.publishedAt = post.publishedAt || new Date();
  await post.save();
  await post.populate('category');
  await emitPublishEvent(post);
  return post;
}

export async function publishScheduledPosts() {
  const now = new Date();
  const scheduledPosts = await Post.find({
    status: 'draft',
    scheduledAt: { $lte: now }
  });

  for (const post of scheduledPosts) {
    await publishPost(post);
  }
}

