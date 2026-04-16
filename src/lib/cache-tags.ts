export const CACHE_TAGS = {
    blogs: "content:blogs",
    blogSlugs: "content:blogs:slugs",
    projects: "content:projects",
    sitemap: "content:sitemap",
    llms: "content:llms",
} as const;

export function getBlogTag(slug: string) {
    return `content:blog:${slug}`;
}

export function getLlmsTag(locale: string) {
    return `content:llms:${locale}`;
}
