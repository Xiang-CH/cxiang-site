import "server-only";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAllPostsMeta, getBlogs, getProjects, isNotionConfigured } from "@/lib/notion";

export type CliProject = {
    id: string;
    title: string;
    abstract: string;
    date?: string;
    landingUrl?: string;
    url?: string;
    repoUrl?: string;
};

export type CliBlogPost = {
    id: string;
    title: string;
    abstract: string;
    date?: string;
    slug: string;
};

export type CliCatalog = {
    availability: "ready" | "empty" | "unavailable";
    projects: CliProject[];
    blogPosts: CliBlogPost[];
};

function readTitle(page: PageObjectResponse): string {
    const property = page.properties.Title;
    if (property?.type !== "title") return "Untitled";

    return (
        property.title
            .map((part) => part.plain_text)
            .join("")
            .trim() || "Untitled"
    );
}

function readRichText(page: PageObjectResponse, key: string): string {
    const property = page.properties[key];
    if (property?.type !== "rich_text") return "";

    return property.rich_text
        .map((part) => part.plain_text)
        .join(" ")
        .trim();
}

function readUrl(page: PageObjectResponse, key: string): string | undefined {
    const property = page.properties[key];
    return property?.type === "url" ? (property.url ?? undefined) : undefined;
}

function readDate(page: PageObjectResponse, key: string): string | undefined {
    const property = page.properties[key];
    return property?.type === "date" ? (property.date?.start ?? undefined) : undefined;
}

async function buildCliCatalog(): Promise<CliCatalog> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.projects, CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs);

    const [blogsResponse, projectsResponse] = await Promise.all([getBlogs(), getProjects()]);
    const postMetas = await getAllPostsMeta(blogsResponse);

    const projects = projectsResponse.results.flatMap((item) => {
        if (item.object !== "page" || !("properties" in item)) return [];

        const page = item as PageObjectResponse;
        return [
            {
                id: page.id,
                title: readTitle(page),
                abstract: readRichText(page, "Abstract"),
                date: readDate(page, "Date"),
                landingUrl: readUrl(page, "Landing Page"),
                url: readUrl(page, "URL"),
                repoUrl: readUrl(page, "Repo"),
            },
        ];
    });

    const blogPosts = blogsResponse.results.flatMap((item) => {
        if (item.object !== "page" || !("properties" in item)) return [];

        const page = item as PageObjectResponse;
        const meta = postMetas.find((post) => post.id === page.id);
        return [
            {
                id: page.id,
                title: readTitle(page),
                abstract: readRichText(page, "Abstract"),
                date: meta?.date ?? readDate(page, "Publish Date"),
                slug: meta?.slug ?? page.id,
            },
        ];
    });

    return {
        availability: projects.length === 0 && blogPosts.length === 0 ? "empty" : "ready",
        projects,
        blogPosts,
    };
}

/**
 * Returns a small, client-safe content index for the interactive portfolio CLI.
 * Operational failures stay outside the cached builder so transient Notion outages
 * are never retained as an empty catalogue.
 */
export async function getCliCatalog(): Promise<CliCatalog> {
    if (!isNotionConfigured) {
        return { availability: "unavailable", projects: [], blogPosts: [] };
    }

    try {
        return await buildCliCatalog();
    } catch (error) {
        console.error("Error loading portfolio CLI catalogue:", error);
        return { availability: "unavailable", projects: [], blogPosts: [] };
    }
}
