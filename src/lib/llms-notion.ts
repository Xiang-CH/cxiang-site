import "server-only";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { notionPageToMarkdown } from "notion-x-to-md";
import { CACHE_TAGS, getBlogTag } from "./cache-tags";
import {
    getAllPostsMeta,
    getBlog,
    getBlogMetadata,
    getBlogs,
    getPostBySlug,
    getProjects,
    type PostMeta,
} from "./notion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";

const footer = `
# Contact Information

Chen Xiang (陈想)

- Email: xiiang.ch@gmail.com
- GitHub: https://github.com/Xiang-CH
- LinkedIn: https://www.linkedin.com/in/xiang-chen-62389526a/
- Instagram: https://www.instagram.com/chen.xiiang/
- X(Twitter): https://x.com/cxiiang

`;

function absUrl(pathname: string): string {
    if (/^https?:\/\//i.test(pathname)) return pathname;
    return `${SITE_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

function readTitle(page: PageObjectResponse): string {
    const p = page.properties.Title;
    if (p?.type === "title") {
        return (
            p.title
                .map((t) => t.plain_text)
                .join("")
                .trim() || "Untitled"
        );
    }
    return "Untitled";
}

function readRichText(page: PageObjectResponse, key: string): string {
    const p = page.properties[key];
    if (p?.type === "rich_text") {
        return p.rich_text
            .map((t) => t.plain_text)
            .join(" ")
            .trim();
    }
    return "";
}

function readUrl(page: PageObjectResponse, key: string): string | undefined {
    const p = page.properties[key];
    if (p?.type === "url") return p.url ?? undefined;
    return undefined;
}

function readDate(page: PageObjectResponse, key: string): string | undefined {
    const p = page.properties[key];
    if (p?.type === "date") return p.date?.start ?? undefined;
    return undefined;
}

// ---------------------------------------------------------------------------
// /llms.txt (site-wide index, per https://llmstxt.org spec)
// ---------------------------------------------------------------------------

/**
 * Build the site's single root `/llms.txt` index. Per the llms.txt spec this
 * file is a markdown document containing:
 *   - an H1 with the site/project name
 *   - a blockquote summary
 *   - zero or more H2 sections whose bodies are bullet lists of
 *     `[title](url): note` links.
 *
 * We enumerate blog posts and projects from Notion so the index stays in sync
 * with published content. The actual markdown for each linked page lives at
 * the same URL but with `Accept: text/markdown` (handled by the Proxy ->
 * `/api/md` rewrite).
 */
export async function buildLlmsIndex(): Promise<string> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.llms, CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.projects);

    // Errors must propagate so `"use cache"` does not memoize a failure.
    const [blogsResp, projectsResp] = await Promise.all([getBlogs(), getProjects()]);
    const postMetas = await getAllPostsMeta(blogsResp);

    const sections: string[] = [];

    sections.push(
        `## Overview

- [${absUrl("/")}](${absUrl("/")}): Bio, skills, experience, and contact info for Chen Xiang.`
    );

    const projectLines: string[] = [
        `- [Projects index](${absUrl("/project")}): Selected projects across web, product, and creative development.`,
    ];
    for (const item of projectsResp.results) {
        if (item.object !== "page" || !("properties" in item)) continue;
        const page = item as PageObjectResponse;
        const title = readTitle(page);
        const abstract = readRichText(page, "Abstract");
        const landing = readUrl(page, "Landing Page");
        const url = landing ?? readUrl(page, "URL");
        if (!url) continue;
        projectLines.push(abstract ? `- [${title}](${url}): ${abstract}` : `- [${title}](${url})`);
    }
    sections.push(`## Projects\n\n${projectLines.join("\n")}`);

    const blogLines: string[] = [`- [Blog index](${absUrl("/blog")}): All blog posts.`];
    for (const item of blogsResp.results) {
        if (item.object !== "page" || !("properties" in item)) continue;
        const page = item as PageObjectResponse;
        const title = readTitle(page);
        const abstract = readRichText(page, "Abstract");
        const slug = postMetas.find((m) => m.id === page.id)?.slug ?? page.id;
        const url = absUrl(`/blog/${slug}`);
        blogLines.push(abstract ? `- [${title}](${url}): ${abstract}` : `- [${title}](${url})`);
    }
    sections.push(`## Blog\n\n${blogLines.join("\n")}`);

    // Per spec: the "Optional" section is for secondary content that callers
    // with tight context budgets can skip.
    sections.push(`## Optional

- [Résumé (PDF)](https://cdn.cxiang.site/resume_chen_xiang.pdf): Chen Xiang's résumé.
- [GitHub](https://github.com/Xiang-CH): Source code and open-source contributions.
- [LinkedIn](https://www.linkedin.com/in/xiang-chen-62389526a/): Professional profile.
- [X(Twitter)](https://x.com/cxiiang): Personal X(Twitter) profile.`);

    return `# Chen Xiang (陈想)

> Personal site of Chen Xiang (陈想) -- software engineer. Portfolio, blog, and projects spanning web, product, and creative development.

Every page linked below is also available as markdown (except for some external project links): request the same URL with \`Accept: text/markdown\` to receive the markdown rendition instead of HTML.

${sections.join("\n\n")}
`;
}

// ---------------------------------------------------------------------------
// /project
// ---------------------------------------------------------------------------

export async function buildProjectListMarkdown(): Promise<string> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.projects, CACHE_TAGS.llms);

    // Let upstream errors propagate so Next's `"use cache"` does NOT memoize a
    // transient Notion failure. An empty-but-successful result is still
    // cached (and invalidates via `CACHE_TAGS.projects`).
    const response = await getProjects();

    const header = `# Projects

Selected projects built by Chen Xiang across web, product, and creative development.

Canonical URL: ${absUrl("/project")}
`;

    if (response.results.length === 0) {
        return `${header}
_No projects are listed yet._
`;
    }

    const lines: string[] = [];
    for (const item of response.results) {
        if (item.object !== "page" || !("properties" in item)) continue;
        const page = item as PageObjectResponse;
        const title = readTitle(page);
        const abstract = readRichText(page, "Abstract");
        const repo = readUrl(page, "Repo");
        const landing = readUrl(page, "Landing Page");
        const url = readUrl(page, "URL");

        lines.push(`## ${title}`);
        if (abstract) lines.push("", abstract);
        const meta: string[] = [];
        if (landing) meta.push(`- Landing Page: ${landing}`);
        if (repo) meta.push(`- Repo: ${repo}`);
        if (url && url !== landing) meta.push(`- Project: ${url}`);
        if (meta.length > 0) lines.push("", ...meta);
        lines.push("");
    }

    return `${header}\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// /blog
// ---------------------------------------------------------------------------

export async function buildBlogListMarkdown(): Promise<string> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.llms);

    // See note in `buildProjectListMarkdown`: errors must propagate so a
    // failed fetch isn't baked into the cache under `cacheLife("max")`.
    const response = await getBlogs();
    const metas: PostMeta[] = await getAllPostsMeta(response);

    const header = `# Blog

Writing by Chen Xiang on software, projects, lessons learned, and more.

Canonical URL: ${absUrl("/blog")}
`;

    if (response.results.length === 0) {
        return `${header}
_No posts published yet._
`;
    }

    const lines: string[] = [];
    for (const item of response.results) {
        if (item.object !== "page" || !("properties" in item)) continue;
        const page = item as PageObjectResponse;
        const title = readTitle(page);
        const abstract = readRichText(page, "Abstract");
        const date = readDate(page, "Publish Date");
        const slug = metas.find((m) => m.id === page.id)?.slug ?? page.id;
        const url = absUrl(`/blog/${slug}`);

        lines.push(`## [${title}](${url})`);
        if (date) lines.push("", `Published on: ${date}`);
        if (abstract) lines.push("", abstract);
        lines.push("");
    }

    return `${header}\n${lines.join("\n")}\n${footer}`;
}

// ---------------------------------------------------------------------------
// /blog/[slug]
// ---------------------------------------------------------------------------

/**
 * Resolve a (possibly-previous) blog slug to its canonical slug. Returns
 * `null` when no post matches. Lets route handlers implement the same 301
 * redirect semantics as the HTML `/blog/[slug]` page without duplicating
 * Notion lookups in the cached builder.
 */
export async function resolveCanonicalBlogSlug(slug: string): Promise<string | null> {
    const post = await getPostBySlug(slug);
    return post ? post.slug : null;
}

/**
 * Build markdown for the canonical slug. Callers should resolve previous
 * slugs via {@link resolveCanonicalBlogSlug} and redirect before invoking
 * this -- doing so keeps the cache key-space free of duplicates.
 * Throws if the slug does not resolve to a post.
 */
export async function buildBlogPostMarkdown(slug: string): Promise<string> {
    "use cache";
    cacheLife("max");
    cacheTag(getBlogTag(slug), CACHE_TAGS.llms);

    const post = await getPostBySlug(slug);
    if (!post) {
        throw new Error(`Post not found: ${slug}`);
    }

    // Defensive: if the caller didn't resolve to the canonical slug, tag the
    // canonical slug too so either revalidation path invalidates this entry.
    if (post.slug !== slug) {
        cacheTag(getBlogTag(post.slug));
    }

    const [recordMap, notionPage] = await Promise.all([
        getBlog(post.id),
        getBlogMetadata(post.id) as Promise<PageObjectResponse>,
    ]);

    const title =
        (notionPage?.properties.Title.type === "title" &&
            notionPage.properties.Title.title[0]?.plain_text) ||
        post.title ||
        "Blog Post";
    const abstract = readRichText(notionPage, "Abstract");
    const date = readDate(notionPage, "Publish Date");

    const canonical = absUrl(`/blog/${post.slug}`);

    // Let notion-x-to-md render the full page (including its `# Title` heading
    // for the page block) and then splice our metadata in right after the
    // first heading line so we keep a single, authoritative H1.
    const rendered = recordMap ? await notionPageToMarkdown(recordMap) : "";
    const meta: string[] = [];
    if (date) meta.push(`_${date}_`);
    if (abstract) meta.push(`> ${abstract}`);
    meta.push(`Canonical URL: ${canonical}`);

    let body: string;
    if (rendered.startsWith("# ")) {
        const newlineIdx = rendered.indexOf("\n");
        const firstLine = newlineIdx === -1 ? rendered : rendered.slice(0, newlineIdx);
        const rest = newlineIdx === -1 ? "" : rendered.slice(newlineIdx + 1).replace(/^\n+/, "");
        body = `${firstLine}\n\n${meta.join("\n\n")}\n\n${rest}`;
    } else {
        body = `# ${title}\n\n${meta.join("\n\n")}\n\n${rendered}`;
    }

    return body.trimEnd() + "\n\n" + footer;
}
