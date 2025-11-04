/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { Client } from "@notionhq/client";
import { NotionAPI } from "notion-client";

if (!process.env.NOTION_SECRET) {
    throw new Error("NOTION_SECRET environment variable is not set");
}

const notion = new Client({
    auth: process.env.NOTION_SECRET,
});

const api = new NotionAPI({
    authToken: process.env.NOTION_SECRET,
});

export const getProjects = async () => {
    // if (process.env.NODE_ENV === 'production') {
    //     // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    //     'use cache'
    // }
    return notion.databases.query({
        database_id: process.env.NOTION_PROJECTS_DATABASE_ID!,
        sorts: [
            {
                property: "Date",
                direction: "descending",
            },
        ],
    });
};

export const getBlogs = async () => {
    // if (process.env.NODE_ENV === 'production') {
    //     // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    //     'use cache'
    // }
    return notion.databases.query({
        database_id: process.env.NOTION_BLOG_DATABASE_ID!,
        filter: {
            or: [
                {
                    property: "Live",
                    checkbox: {
                        equals: true,
                    },
                },
            ],
        },
        sorts: [
            {
                property: "Publish Date",
                direction: "descending",
            },
        ],
    });
};

export const getBlogMetadata = async (id: string) => {
    if (!id) {
        throw new Error("Blog ID is required");
    }

    return notion.pages.retrieve({
        page_id: id,
    });
};

export const getBlog = async (id: string) => {
    if (!id) {
        throw new Error("Blog ID is required");
    }

    // if (process.env.NODE_ENV === 'production') {
    //     // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    //     'use cache'
    // }

    return api.getPage(id);
};

// ---- Slug + Meta utilities appended below ----

export type PostMeta = {
    id: string;
    title: string;
    slug: string;
    date?: string;
    previousSlugs?: string[];
};

// Normalize a string into a URL-safe slug
export async function slugifyTitle(title: string): Promise<string> {
    if (!title) return "post";
    // Unicode normalize and strip diacritics
    let s = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    s = s.trim().toLowerCase();
    s = s.replace(/\s+/g, "-"); // whitespace -> hyphen
    s = s.replace(/[^a-z0-9-]/g, ""); // strip unsafe
    s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, ""); // collapse and trim hyphens
    return s || "post";
}

function shortIdFromPageId(id: string): string {
    return (id || "").replace(/-/g, "").slice(0, 8) || "post";
}

// Attempt to read a string value from a Notion property that could be title or rich_text
function readStringProperty(prop: any): string | undefined {
    if (!prop) return undefined;
    try {
        if (prop.type === "title") {
            const text = prop.title?.[0]?.plain_text;
            return typeof text === "string" && text.length > 0 ? text : undefined;
        }
        if (prop.type === "rich_text") {
            const all = (prop.rich_text || [])
                .map((t: any) => t?.plain_text)
                .filter((v: any) => typeof v === "string" && v.length > 0);
            if (all.length > 0) return all.join(" ");
        }
        if (prop.type === "url") {
            return typeof prop.url === "string" && prop.url.length > 0 ? prop.url : undefined;
        }
        if (prop.type === "select") {
            const name = prop.select?.name;
            return typeof name === "string" && name.length > 0 ? name : undefined;
        }
    } catch {
        // ignore
    }
    return undefined;
}

function readPreviousSlugsProperty(prop: any): string[] | undefined {
    if (!prop) return undefined;
    try {
        // Support multi_select type: use option names
        if (prop.type === "multi_select") {
            const arr = (prop.multi_select || [])
                .map((o: any) => o?.name)
                .filter((v: any) => typeof v === "string" && v.length > 0);
            if (arr.length > 0) return arr;
        }
        // Support rich_text: concatenate and split by comma/newline
        if (prop.type === "rich_text") {
            const raw = (prop.rich_text || [])
                .map((t: any) => t?.plain_text)
                .filter((v: any) => typeof v === "string" && v.length > 0)
                .join(" ");
            if (raw) {
                const list = raw
                    .split(/[,;\n]/g)
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0);
                if (list.length > 0) return list;
            }
        }
    } catch {
        // ignore
    }
    return undefined;
}

/**
 * Fetch all posts metadata (id, title, slug, date, previousSlugs)
 * - Slug precedence:
 *   1) Notion property "Slug" if present and non-empty (normalized with slugifyTitle constraints)
 *   2) slugifyTitle(Title)
 * - Duplicate handling: suffix later duplicates with "-{shortId}" (first 8 chars of page id without dashes)
 */
export async function getAllPostsMeta(): Promise<PostMeta[]> {
    const res = await getBlogs();
    const metas: PostMeta[] = [];
    const usedSlugs = new Set<string>();

    for (const item of res.results) {
        if (!item || item.object !== "page" || !("properties" in item)) continue;
        const page: any = item;

        const title = readStringProperty(page.properties?.Title) ?? "Untitled";

        // Prefer explicit "Slug" property if available
        const explicitSlugRaw = readStringProperty(page.properties?.Slug);

        let candidateSlug = explicitSlugRaw
            ? await slugifyTitle(explicitSlugRaw)
            : await slugifyTitle(title);

        if (!candidateSlug) {
            candidateSlug = `post-${shortIdFromPageId(page.id)}`;
        }

        let finalSlug = candidateSlug;
        if (usedSlugs.has(finalSlug)) {
            finalSlug = `${candidateSlug}-${shortIdFromPageId(page.id)}`;
        }
        usedSlugs.add(finalSlug);

        // Previous Slugs if present
        const previousSlugs = readPreviousSlugsProperty(page.properties?.["Previous Slugs"]) ?? [];

        // Date
        let date: string | undefined;
        const dateProp = page.properties?.["Publish Date"] ?? page.properties?.Date;
        if (dateProp?.type === "date") {
            date = dateProp.date?.start ?? undefined;
        }
        // Fallbacks from Notion page timestamps
        if (!date) {
            date = page.created_time ?? page.last_edited_time ?? undefined;
        }

        metas.push({
            id: page.id,
            title,
            slug: finalSlug,
            date,
            previousSlugs,
        });
    }

    return metas;
}

/**
 * Resolve a post by slug. Returns the post's current slug and previousSlugs.
 * If 'slug' matches a previous slug, caller can decide to redirect to the current slug.
 */
export async function getPostBySlug(
    slug: string
): Promise<{ id: string; title: string; slug: string; previousSlugs: string[] } | null> {
    const all = await getAllPostsMeta();
    const direct = all.find((p) => p.slug === slug);
    if (direct) {
        return {
            id: direct.id,
            title: direct.title,
            slug: direct.slug,
            previousSlugs: direct.previousSlugs ?? [],
        };
    }
    const prev = all.find((p) => (p.previousSlugs ?? []).includes(slug));
    if (prev) {
        return {
            id: prev.id,
            title: prev.title,
            slug: prev.slug, // current slug
            previousSlugs: prev.previousSlugs ?? [],
        };
    }
    return null;
}

/**
 * Resolve the canonical slug for a given Notion page id.
 */
export async function getSlugById(id: string): Promise<string | null> {
    const all = await getAllPostsMeta();
    const found = all.find((p) => p.id === id);
    return found?.slug ?? null;
}
