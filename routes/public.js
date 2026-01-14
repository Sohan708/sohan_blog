import { Router } from 'express';
import {
  home,
  blogList,
  postDetail,
  categoryPage,
  tagPage,
  sitemap,
  robots,
  rss
} from '../controllers/publicController.js';

const router = Router();

router.get('/', home);
router.get('/blog', blogList);
router.get('/blog/:slug', postDetail);
router.get('/category/:slug', categoryPage);
router.get('/tag/:tag', tagPage);
router.get('/sitemap.xml', sitemap);
router.get('/robots.txt', robots);
router.get('/rss.xml', rss);

export default router;

