export async function emitPublishEvent(post) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const payload = {
    postId: post._id.toString(),
    title: post.title,
    slug: post.slug,
    url: `${baseUrl}/blog/${post.slug}`,
    excerpt: post.excerpt,
    tags: post.tags,
    category: post.category?.name || post.category?.toString(),
    coverImageUrl: post.coverImagePath ? `${baseUrl}${post.coverImagePath}` : null,
    publishedAt: post.publishedAt
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Webhook emit failed', error.message);
  }
}

