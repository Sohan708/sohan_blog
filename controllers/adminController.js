import Category from '../models/Category.js';
import Post from '../models/Post.js';
import { slugify } from '../utils/slug.js';
import { publishPost } from '../services/publishService.js';
import { formatDate } from '../utils/date.js';
import { uploadImage } from '../services/cloudinary.js';

export async function dashboard(req, res, next) {
  try {
    const totalPosts = await Post.countDocuments({});
    const drafts = await Post.countDocuments({ status: 'draft' });
    const published = await Post.countDocuments({ status: 'published' });
    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        totalPosts,
        drafts,
        published,
        views: 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listPosts(req, res, next) {
  try {
    const posts = await Post.find({}).populate('category').sort({ createdAt: -1 });
    const withCovers = posts.map((post) => {
      const content = post.content || '';
      const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      const fallbackCover = match ? match[1] : null;
      return {
        ...post.toObject(),
        coverImagePath: post.coverImagePath || fallbackCover
      };
    });
    res.render('admin/posts-list', { title: 'Posts', posts: withCovers, formatDate });
  } catch (error) {
    next(error);
  }
}

export async function newPostForm(req, res, next) {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.render('admin/post-form', {
      title: 'New Post',
      post: null,
      categories,
      errors: []
    });
  } catch (error) {
    next(error);
  }
}

export async function editPostForm(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).populate('category');
    if (!post) return res.redirect('/admin/posts');
    const categories = await Category.find({}).sort({ name: 1 });
    res.render('admin/post-form', {
      title: 'Edit Post',
      post,
      categories,
      errors: []
    });
  } catch (error) {
    next(error);
  }
}

function parseTags(tagsInput) {
  return (tagsInput || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function validatePostInput(body) {
  const errors = [];
  if (!body.title) errors.push('Title is required.');
  if (!body.excerpt) errors.push('Excerpt is required.');
  if (!body.content) errors.push('Content is required.');
  if (!body.category) errors.push('Category is required.');
  return errors;
}

function normalizeScheduledAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function createPost(req, res, next) {
  try {
    const errors = validatePostInput(req.body);
    const categories = await Category.find({}).sort({ name: 1 });
    if (errors.length) {
      return res.render('admin/post-form', {
        title: 'New Post',
        post: req.body,
        categories,
        errors
      });
    }

    const slug = slugify(req.body.slug || req.body.title);
    if (!slug) {
      return res.render('admin/post-form', {
        title: 'New Post',
        post: req.body,
        categories,
        errors: ['Slug is required.']
      });
    }

    const existing = await Post.findOne({ slug });
    if (existing) {
      return res.render('admin/post-form', {
        title: 'New Post',
        post: req.body,
        categories,
        errors: ['Slug already exists.']
      });
    }

    const scheduledAt = normalizeScheduledAt(req.body.scheduledAt);
    const status = scheduledAt && scheduledAt > new Date() ? 'draft' : req.body.status || 'draft';

    const coverImageUrl = req.file ? await uploadImage(req.file) : null;

    const post = new Post({
      title: req.body.title,
      slug,
      excerpt: req.body.excerpt,
      content: req.body.content,
      coverImagePath: coverImageUrl,
      category: req.body.category,
      tags: parseTags(req.body.tags),
      status,
      scheduledAt,
      metaTitle: req.body.metaTitle,
      metaDescription: req.body.metaDescription
    });

    if (status === 'published') {
      await publishPost(post);
    } else {
      await post.save();
    }

    res.redirect('/admin/posts');
  } catch (error) {
    next(error);
  }
}

export async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/admin/posts');

    const errors = validatePostInput(req.body);
    const categories = await Category.find({}).sort({ name: 1 });
    if (errors.length) {
      return res.render('admin/post-form', {
        title: 'Edit Post',
        post: { ...post.toObject(), ...req.body },
        categories,
        errors
      });
    }

    const slug = slugify(req.body.slug || req.body.title);
    const existing = await Post.findOne({ slug, _id: { $ne: post._id } });
    if (existing) {
      return res.render('admin/post-form', {
        title: 'Edit Post',
        post: { ...post.toObject(), ...req.body },
        categories,
        errors: ['Slug already exists.']
      });
    }

    const scheduledAt = normalizeScheduledAt(req.body.scheduledAt);
    let status = req.body.status || 'draft';
    if (scheduledAt && scheduledAt > new Date()) {
      status = 'draft';
    }

    const wasPublished = post.status === 'published';

    post.title = req.body.title;
    post.slug = slug;
    post.excerpt = req.body.excerpt;
    post.content = req.body.content;
    post.category = req.body.category;
    post.tags = parseTags(req.body.tags);
    post.status = status;
    post.scheduledAt = scheduledAt;
    post.metaTitle = req.body.metaTitle;
    post.metaDescription = req.body.metaDescription;
    if (req.file) {
      post.coverImagePath = await uploadImage(req.file);
    }

    if (!wasPublished && status === 'published') {
      await publishPost(post);
    } else {
      if (status !== 'published') {
        post.publishedAt = null;
      }
      await post.save();
    }

    res.redirect('/admin/posts');
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req, res, next) {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/admin/posts');
  } catch (error) {
    next(error);
  }
}

export async function categoriesPage(req, res, next) {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.render('admin/categories', { title: 'Categories', categories, errors: [] });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      const categories = await Category.find({}).sort({ name: 1 });
      return res.render('admin/categories', {
        title: 'Categories',
        categories,
        errors: ['Category name is required.']
      });
    }
    const slug = slugify(name);
    const exists = await Category.findOne({ slug });
    if (exists) {
      const categories = await Category.find({}).sort({ name: 1 });
      return res.render('admin/categories', {
        title: 'Categories',
        categories,
        errors: ['Category already exists.']
      });
    }
    await Category.create({ name, slug });
    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
}

export async function tagsPage(req, res, next) {
  try {
    const tags = await Post.distinct('tags');
    res.render('admin/tags', { title: 'Tags', tags });
  } catch (error) {
    next(error);
  }
}

export async function deleteTag(req, res, next) {
  try {
    const tag = req.params.tag;
    await Post.updateMany({}, { $pull: { tags: tag } });
    res.redirect('/admin/tags');
  } catch (error) {
    next(error);
  }
}

export async function mediaPage(req, res, next) {
  try {
    const files = await Post.distinct('coverImagePath', { coverImagePath: { $ne: null } });
    res.render('admin/media', { title: 'Media', files });
  } catch (error) {
    next(error);
  }
}

export async function uploadMedia(req, res, next) {
  try {
    if (req.file) {
      await uploadImage(req.file);
    }
    res.redirect('/admin/media');
  } catch (error) {
    next(error);
  }
}

export async function uploadEditorImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = await uploadImage(req.file);
    if (!url) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    return res.json({ url });
  } catch (error) {
    return next(error);
  }
}

