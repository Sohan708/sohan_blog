import Category from '../models/Category.js';
import Post from '../models/Post.js';
import { estimateReadTime } from '../utils/readTime.js';
import { formatDate, toIso } from '../utils/date.js';

const POSTS_PER_PAGE = 6;

function withCover(post) {
  const data = post.toObject ? post.toObject() : post;
  const content = data.content || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  const fallbackCover = match ? match[1] : null;
  return {
    ...data,
    coverImagePath: data.coverImagePath || fallbackCover
  };
}

function resolveOgImage(coverImagePath, baseUrl) {
  if (!coverImagePath) return null;
  if (/^https?:\/\//i.test(coverImagePath)) return coverImagePath;
  return `${baseUrl}${coverImagePath}`;
}

export async function home(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const featured = await Post.find({ status: 'published' })
      .populate('category')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3);

    const total = await Post.countDocuments({ status: 'published' });
    const posts = await Post.find({ status: 'published' })
      .populate('category')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE);

    res.render('public/home', {
      title: 'Home',
      metaTitle: 'Home | Sohan Blog',
      metaDescription: 'Featured and latest posts.',
      featured: featured.map(withCover),
      posts: posts.map(withCover),
      page,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
      formatDate,
      estimateReadTime
    });
  } catch (error) {
    next(error);
  }
}

export async function blogList(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const q = (req.query.q || '').trim();
    const categorySlug = req.query.category || '';
    const tag = req.query.tag || '';

    const filter = { status: 'published' };

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { excerpt: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') }
      ];
    }

    let category = null;
    if (categorySlug) {
      category = await Category.findOne({ slug: categorySlug });
      if (category) filter.category = category._id;
    }

    if (tag) {
      filter.tags = tag;
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .populate('category')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE);

    const categories = await Category.find({}).sort({ name: 1 });

    res.render('public/blog', {
      title: 'Blog',
      metaTitle: 'Blog | Sohan Blog',
      metaDescription: 'Browse the latest blog posts.',
      posts: posts.map(withCover),
      page,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
      q,
      category,
      tag,
      categories,
      formatDate,
      estimateReadTime
    });
  } catch (error) {
    next(error);
  }
}

export async function postDetail(req, res, next) {
  try {
    const postDoc = await Post.findOne({ slug: req.params.slug, status: 'published' }).populate('category');
    const post = postDoc ? withCover(postDoc) : null;
    if (!post) {
      return res.status(404).render('public/404', { title: 'Not Found' });
    }

    const related = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      category: post.category
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    res.render('public/post', {
      title: post.metaTitle || post.title,
      metaTitle: post.metaTitle || post.title,
      metaDescription: post.metaDescription || post.excerpt,
      ogImage: resolveOgImage(post.coverImagePath, baseUrl),
      post,
      related,
      formatDate,
      estimateReadTime,
      toIso
    });
  } catch (error) {
    next(error);
  }
}

export async function categoryPage(req, res, next) {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).render('public/404', { title: 'Not Found' });
    }

    const posts = await Post.find({ status: 'published', category: category._id })
      .populate('category')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.render('public/category', {
      title: category.name,
      metaTitle: `${category.name} | Sohan Blog`,
      metaDescription: `Posts filed under ${category.name}.`,
      category,
      posts,
      formatDate,
      estimateReadTime
    });
  } catch (error) {
    next(error);
  }
}

export async function tagPage(req, res, next) {
  try {
    const tag = req.params.tag;
    const posts = await Post.find({ status: 'published', tags: tag })
      .populate('category')
      .sort({ publishedAt: -1, createdAt: -1 });

    res.render('public/tag', {
      title: `Tag: ${tag}`,
      metaTitle: `Tag: ${tag} | Sohan Blog`,
      metaDescription: `Posts tagged with ${tag}.`,
      tag,
      posts,
      formatDate,
      estimateReadTime
    });
  } catch (error) {
    next(error);
  }
}

export async function sitemap(req, res, next) {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 });
    const categories = await Category.find({}).sort({ name: 1 });

    const tags = await Post.distinct('tags', { status: 'published' });

    const urls = [
      { loc: `${baseUrl}/`, lastmod: new Date() },
      { loc: `${baseUrl}/blog`, lastmod: new Date() }
    ];

    posts.forEach((post) => {
      urls.push({ loc: `${baseUrl}/blog/${post.slug}`, lastmod: post.updatedAt || post.createdAt });
    });

    categories.forEach((category) => {
      urls.push({ loc: `${baseUrl}/category/${category.slug}`, lastmod: new Date() });
    });

    tags.forEach((tag) => {
      urls.push({ loc: `${baseUrl}/tag/${encodeURIComponent(tag)}`, lastmod: new Date() });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (url) =>
            `  <url><loc>${url.loc}</loc><lastmod>${toIso(url.lastmod)}</lastmod></url>`
        )
        .join('\n') +
      `\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
}

export function robots(req, res) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
}

export async function rss(req, res, next) {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(20);

    const items = posts
      .map((post) => {
        return `\n<item>\n<title>${post.title}</title>\n<link>${baseUrl}/blog/${post.slug}</link>\n<guid>${baseUrl}/blog/${post.slug}</guid>\n<pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>\n<description><![CDATA[${post.excerpt}]]></description>\n</item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>Blog RSS</title>\n<link>${baseUrl}</link>\n<description>Latest posts</description>${items}\n</channel>\n</rss>`;

    res.header('Content-Type', 'application/rss+xml');
    res.send(rssXml);
  } catch (error) {
    next(error);
  }
}

