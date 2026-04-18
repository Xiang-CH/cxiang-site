import { skills } from "@/app/[locale]/_components/skills";
import { routing } from "@/i18n/routing";
import { prefersMarkdown } from "./accept";

type Messages = typeof import("../../locales/en.json");

// Cache the loading *promise* so concurrent callers share one dynamic import.
const messagesCache = new Map<string, Promise<Messages>>();

async function loadMessages(locale: string): Promise<Messages> {
    const cached = messagesCache.get(locale);
    if (cached) return cached;
    const promise = import(`../../locales/${locale}.json`).then(
        (mod) => (mod.default ?? mod) as unknown as Messages
    );
    messagesCache.set(locale, promise);
    try {
        return await promise;
    } catch (err) {
        // Don't hold onto a rejected promise forever.
        messagesCache.delete(locale);
        throw err;
    }
}

export function resolveLocale(pathname: string): string {
    for (const locale of routing.locales) {
        if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
            return locale;
        }
    }
    return routing.defaultLocale;
}

export { prefersMarkdown };

export function estimateTokens(text: string): number {
    // Rough GPT-style estimate: ~4 characters per token. Good enough for
    // clients using `x-markdown-tokens` to size context windows / chunking.
    return Math.ceil(text.length / 4);
}

/**
 * CDN cache directives shared by every markdown response (both the `/api/md`
 * catch-all and the root `/llms.txt`). Keeps behaviour identical regardless
 * of which surface the client hits.
 */
export const MARKDOWN_CACHE_CONTROL =
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/**
 * Markdown response for the `/api/md` catch-all. Forces `text/markdown`
 * because that surface is only reached via the proxy rewrite on
 * `Accept: text/markdown`, so there is no negotiation to perform.
 */
export function markdownResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "x-markdown-tokens": String(estimateTokens(body)),
            "Cache-Control": MARKDOWN_CACHE_CONTROL,
            Vary: "Accept",
        },
    });
}

/**
 * Builds the "home" markdown served at `/` (and the per-locale variants)
 * when clients request markdown via content negotiation. This is the
 * site summary / bio card -- NOT the `/llms.txt` index, which lives in
 * `llms-notion.buildLlmsIndex`.
 */
export async function buildHomeMarkdown(locale: string): Promise<string> {
    const m = await loadMessages(locale);

    const name = m.intro.name;
    const nameSecondary = m.intro.nameSecondary;
    const role = m.terminal.typedRole;
    const about = m.terminal.about.replace(/\n/g, " ");
    const stack = m.terminal.stack;
    const contactIntro = m.terminal.contactIntro;
    const aboutLabel = m.main.about.label;
    const skillsLabel = m.main.skills.label;
    const experienceLabel = m.main.experience.label;
    const contactLabel = m.main.contact.label;
    const langLabel = m.main.skills.languages;
    const fwLabel = m.main.skills.frameworks;
    const toolsLabel = m.main.skills.tools;
    const orgs = m.main.experience.organizations;

    return `# ${name} (${nameSecondary})

> ${role}

- Résumé: https://cdn.cxiang.site/resume_chen_xiang.pdf

## ${aboutLabel}

${about}
${stack}

## ${skillsLabel}

### ${langLabel}
${skills.languages.map((l) => l.name).join(", ")}

### ${fwLabel}
${skills.frameworks.map((f) => f.name).join(", ")}

### ${toolsLabel}
${skills.tools.map((t) => t.name).join(", ")}

## ${experienceLabel}

${orgs.map((o) => `- **${o.position}** at ${o.company} (${o.duration})\n  ${o.website}`).join("\n\n")}

## ${contactLabel}

${contactIntro}

- Email: xiiang.ch@gmail.com
- GitHub: https://github.com/Xiang-CH
- LinkedIn: https://www.linkedin.com/in/xiang-chen-62389526a/
- Instagram: https://www.instagram.com/chen.xiiang/
- X(Twitter): https://x.com/cxiiang

## Site Map
- [My Projects](/project)
- [My Blog](/blog)
`;
}

/**
 * Discriminated result of a markdown route lookup. Route handlers translate
 * each case into the appropriate HTTP response (200, 301, or 404). Keeping
 * redirects as data -- not thrown errors -- means callers never confuse
 * "expected control-flow" with a real failure, and we don't cache redirects
 * under `"use cache"`.
 */
export type MarkdownResult =
    | { kind: "ok"; body: string }
    | { kind: "redirect"; to: string }
    | { kind: "notFound" };

/**
 * Dispatch to the appropriate markdown builder based on the request path.
 * Unknown paths return `{ kind: "notFound" }`; previous blog slugs return
 * `{ kind: "redirect" }` so the canonical URL is the only one that ever
 * serves 200. Errors from the underlying Notion fetches propagate to the
 * caller (so `"use cache"` does not memoize transient failures).
 */
export async function buildMarkdownForPath(
    pathname: string,
    locale: string
): Promise<MarkdownResult> {
    // Strip a leading locale segment if present so the remaining path matches
    // route-style comparisons below.
    let path = pathname;
    for (const loc of routing.locales) {
        if (path === `/${loc}`) {
            path = "/";
            break;
        }
        if (path.startsWith(`/${loc}/`)) {
            path = path.slice(loc.length + 1);
            break;
        }
    }

    // Normalize trailing slash (but keep "/").
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    if (path === "/" || path === "") {
        return { kind: "ok", body: await buildHomeMarkdown(locale) };
    }

    if (path === "/project" || path === "/projects") {
        const mod = await import("./llms-notion");
        return { kind: "ok", body: await mod.buildProjectListMarkdown() };
    }

    if (path === "/blog" || path === "/blogs") {
        const mod = await import("./llms-notion");
        return { kind: "ok", body: await mod.buildBlogListMarkdown() };
    }

    const blogMatch = path.match(/^\/blogs?\/([^\/?#]+)$/);
    if (blogMatch) {
        const slug = blogMatch[1];
        const mod = await import("./llms-notion");
        const canonical = await mod.resolveCanonicalBlogSlug(slug);
        if (!canonical) return { kind: "notFound" };
        if (canonical !== slug) {
            return { kind: "redirect", to: `/blog/${canonical}` };
        }
        return { kind: "ok", body: await mod.buildBlogPostMarkdown(canonical) };
    }

    return { kind: "notFound" };
}
