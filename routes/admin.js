import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  dashboard,
  listPosts,
  newPostForm,
  editPostForm,
  createPost,
  updatePost,
  deletePost,
  categoriesPage,
  createCategory,
  deleteCategory,
  tagsPage,
  deleteTag,
  mediaPage,
  uploadMedia
} from '../controllers/adminController.js';
import { loginForm, login, logout } from '../controllers/authController.js';

const router = Router();

router.get('/login', loginForm);
router.post('/login', login);
router.post('/logout', logout);

router.get('/', requireAuth, dashboard);
router.get('/posts', requireAuth, listPosts);
router.get('/posts/new', requireAuth, newPostForm);
router.post('/posts', requireAuth, upload.single('coverImage'), createPost);
router.get('/posts/:id/edit', requireAuth, editPostForm);
router.post('/posts/:id', requireAuth, upload.single('coverImage'), updatePost);
router.post('/posts/:id/delete', requireAuth, deletePost);

router.get('/categories', requireAuth, categoriesPage);
router.post('/categories', requireAuth, createCategory);
router.post('/categories/:id/delete', requireAuth, deleteCategory);

router.get('/tags', requireAuth, tagsPage);
router.post('/tags/:tag/delete', requireAuth, deleteTag);

router.get('/media', requireAuth, mediaPage);
router.post('/media', requireAuth, upload.single('media'), uploadMedia);

export default router;

