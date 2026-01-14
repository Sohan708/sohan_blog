import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import session from 'express-session';
import connectDB from './config/db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { notFound, errorHandler } from './middleware/error.js';
import { startScheduler } from './services/scheduler.js';

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());
app.use(mongoSanitize());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  res.locals.user = req.session.user || null;
  res.locals.metaTitle = null;
  res.locals.metaDescription = null;
  res.locals.ogImage = null;
  next();
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

startScheduler();

