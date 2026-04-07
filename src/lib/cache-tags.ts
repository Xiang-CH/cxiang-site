export const CACHE_TAGS = {
    blogs: "content:blogs",
    blogSlugs: "content:blogs:slugs",
    projects: "content:projects",
    sitemap: "content:sitemap",
    llms: "content:llms",
} as const;

export function getBlogTag(id: string) {
    return `content:blog:${id}`;
}

export function getLlmsTag(locale: string) {
    return `content:llms:${locale}`;
}
