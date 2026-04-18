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
