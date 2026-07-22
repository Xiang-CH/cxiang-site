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

/**
 * Reads the page title, using `"Untitled"` when no usable title is available.
 *
 * @param page - The Notion page whose title property to read
 * @returns The trimmed title text, or `"Untitled"` when the title is missing or empty
 */
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

/**
 * Reads and combines the plain text content of a rich-text page property.
 *
 * @param page - The Notion page containing the property
 * @param key - The property name to read
 * @returns The trimmed rich-text content, or an empty string when the property is unavailable or has a different type
 */
function readRichText(page: PageObjectResponse, key: string): string {
    const property = page.properties[key];
    if (property?.type !== "rich_text") return "";

    return property.rich_text
        .map((part) => part.plain_text)
        .join(" ")
        .trim();
}

/**
 * Reads a URL property from a Notion page.
 *
 * @param page - The Notion page containing the property
 * @param key - The property name
 * @returns The property URL, or `undefined` when the property is missing, has another type, or has no URL
 */
function readUrl(page: PageObjectResponse, key: string): string | undefined {
    const property = page.properties[key];
    return property?.type === "url" ? (property.url ?? undefined) : undefined;
}

/**
 * Reads the start date from a Notion date property.
 *
 * @param page - The Notion page containing the property
 * @param key - The property name
 * @returns The property's start date, or `undefined` when the property is unavailable or has no start date
 */
function readDate(page: PageObjectResponse, key: string): string | undefined {
    const property = page.properties[key];
    return property?.type === "date" ? (property.date?.start ?? undefined) : undefined;
}

/**
 * Builds the portfolio catalogue from project and blog content.
 *
 * @returns The catalogue with its availability status, projects, and blog posts.
 */
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
 * Provides a client-safe content catalogue for the interactive portfolio CLI.
 *
 * @returns The available catalogue, or an unavailable catalogue with empty collections when Notion is unconfigured or cannot be accessed.
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
