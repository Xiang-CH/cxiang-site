<!-- BEGIN:nextjs-agent-rules -->

# Next.js: Read docs for structural or framework-specific work

Before large structural modifications or Next.js-specific changes, find and read the relevant doc in `node_modules/next/dist/docs/`. For small, isolated changes that do not depend on Next.js framework behavior, this docs check is not required.

<!-- END:nextjs-agent-rules -->

# shadcn/ui: ALWAYS use shadcn/ui components and styles when possible. This is a core part of the site's design system. Check the shadcn/ui skill for usage examples and documentation.

# Tailwind CSS: ALWAYS prioritize Tailwind CSS for styling. Do not use custom CSS or inline styles unless absolutely necessary. Check the tailwind-design-system skill for usage examples and documentation.

## Cursor Cloud specific instructions

### Project overview

Personal portfolio & blog site (cxiang.site) — Next.js 16 + React 19 + TypeScript, Tailwind CSS 4, shadcn/ui, next-intl for i18n (en, zh-CN). Notion is used as the headless CMS for blog posts and projects.

### Package manager

**Bun** — all scripts use `bun --bun next ...`. Lockfile is `bun.lock`.

### Required environment variables

| Variable                         | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `NOTION_SECRET`                  | Notion integration token — app throws on startup without it |
| `NOTION_PROJECTS_DATA_SOURCE_ID` | Notion data source ID for projects                          |
| `NOTION_BLOG_DATA_SOURCE_ID`     | Notion data source ID for blog posts                        |

### Common commands

See `package.json` scripts. Key ones:

- **Dev server:** `bun run dev` (runs on port 3000, redirects `/` to `/en`)
- **Lint:** `bun run lint` (ESLint)
- **Format check:** `bun run format:check` (Prettier)
- **Format + lint:** `bun run check`

### Known caveats

- The blog page (`/blog`) may 500 if Notion content references image hostnames not listed in `next.config.ts` `images.remotePatterns`. This is a content-dependent issue, not a setup problem.
- The root URL `/` redirects (307) to `/en` via next-intl routing.
- No automated test suite exists in this repo — validation relies on lint, format checks, and manual testing.
