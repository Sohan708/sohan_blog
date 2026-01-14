# Sohan Blog CMS

Production-ready custom blog CMS with Express, MongoDB, and EJS.

## Features
- Public blog with home, list, category, tag, and single post pages.
- Admin panel with login, posts, categories, tags, and media uploads.
- Scheduled publishing with webhook support.
- RSS, sitemap, robots, and basic SEO meta tags.

## Setup
1) Install dependencies
```bash
npm install
```

2) Create environment file
```bash
copy .env.example .env
```

3) Update `.env` values for MongoDB, session secret, and admin credentials.

4) Seed the first admin user
```bash
npm run seed
```

5) Start development server
```bash
npm run dev
```

## Environment variables
- `PORT`
- `MONGODB_URI`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BASE_URL`
- `WEBHOOK_URL` (optional)

## Webhook payload
When a post is published, a JSON payload is sent to `WEBHOOK_URL`:
```json
{
  "postId": "...",
  "title": "...",
  "slug": "...",
  "url": "...",
  "excerpt": "...",
  "tags": ["..."],
  "category": "...",
  "coverImageUrl": "...",
  "publishedAt": "..."
}
```

## Notes
- Uploads are stored under `public/uploads`.
- Sessions use the default MemoryStore. Consider a persistent store for production.

