# Chen Xiang's Personal Website

This is the source code for my personal website, built with Next.js and TypeScript, it uses [Notion](https://notion.so) as a headless blog CMS. It serves as a portfolio to showcase my projects, skills, and experience.

## Features

- **Next.js**: For server-side rendering and routing.
- **Tailwind CSS**: For styling and responsive design.
- **Next-intl**: For internationalization support.
- **React-notion-x**: For rendering Notion pages.
- **Notion-x-to-md**: For rendering Notion pages to markdown.

## Agent Ready

- `/robots.txt` includes `Content-Signal: search=yes, ai-input=yes, ai-train=no`.
- `/llms.txt` is a single site-wide index per the [llms.txt spec](https://llmstxt.org/)
- `/sitemap.md` is a sitemap per the [vercel guide](https://vercel.com/kb/guide/agent-readability-spec)
- `.md` mirrors for all pages.
- Any page can be fetched as markdown by sending `Accept: text/markdown`. The Proxy rewrites such requests to `/api/md${pathname}`, which renders the same content (home bio, blog posts, project list, blog list) as markdown instead of HTML.

## SEO

- `/sitemap.xml` is a sitemap per the [sitemap spec](https://www.sitemaps.org/)
- `/robots.txt` is a robots.txt file per the [robots.txt spec](https://www.robotstxt.org/)
- opengraph and twitter card are configured in `src/lib/seo.ts`
- json-ld and other SEO metadata configured in all pages.

## Caching

Caches for "max" lifetime until cache tags are used to invalidate the cache.
Possible tags are:

- content:projects
- content:blogs
- content:blogs:slugs
- content:sitemap
- content:llms

## Blog statistics

Blog views and likes are stored in Neon Postgres and keyed by globally unique blog slugs. Install
Neon through Vercel Marketplace, then configure these server-only variables for local development:

- `DATABASE_URL` — Neon pooled connection string for the application.
- `DATABASE_URL_UNPOOLED` — direct Neon connection string for migrations.
- `BLOG_STATS_HASH_SECRET` — a high-entropy secret used to HMAC anonymous browser identifiers.

Generate a migration after changing `src/db/schema.ts` with `bun run db:generate`. Apply migrations
with `bun run db:migrate`; it reads the direct connection string from `.env.local`.

### Import existing Vercel pageviews

The one-time importer stores existing Vercel Web Analytics pageviews in a separate historical
baseline. This keeps it separate from the privacy-conscious, per-browser-per-UTC-day counter used
for new views, and makes imports repeatable without double-counting.

First apply the migration, then inspect the import without changing Neon:

```bash
bun run db:migrate
bun run db:import:vercel-views -- --project <vercel-project> --since 2025-01-01
```

When the listed slugs and totals look right, re-run with `--apply`:

```bash
bun run db:import:vercel-views -- --project <vercel-project> --since 2025-01-01 --apply
```

The script calls `vercel metrics` with production-only `request_path` grouping, accepts only
canonical `/blog/<slug>` paths, and uses `DATABASE_URL_UNPOOLED` for the write. It replaces the
historical baseline for each imported slug, so re-run it with the same date range if a retry is
needed. Authenticate the Vercel CLI first (`vercel login`) and use `--scope <team>` when needed.
