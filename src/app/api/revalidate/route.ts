import { revalidateTag } from "next/cache";
import { CACHE_TAGS, getBlogTag, getLlmsTag } from "@/lib/cache-tags";

type RevalidationRequest =
    | { domain: "blogs"; id?: string }
    | { domain: "projects" }
    | { domain: "sitemap" }
    | { domain: "llms"; locale?: string };

function getTagsToRevalidate(payload: RevalidationRequest): string[] {
    switch (payload.domain) {
        case "blogs":
            return payload.id
                ? [CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.sitemap, getBlogTag(payload.id)]
                : [CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.sitemap];
        case "projects":
            return [CACHE_TAGS.projects, CACHE_TAGS.sitemap];
        case "sitemap":
            return [CACHE_TAGS.sitemap];
        case "llms":
            return payload.locale ? [CACHE_TAGS.llms, getLlmsTag(payload.locale)] : [CACHE_TAGS.llms];
        default:
            return [];
    }
}

function isValidPayload(value: unknown): value is RevalidationRequest {
    if (!value || typeof value !== "object") {
        return false;
    }

    const payload = value as Partial<RevalidationRequest>;
    return (
        payload.domain === "blogs" ||
        payload.domain === "projects" ||
        payload.domain === "sitemap" ||
        payload.domain === "llms"
    );
}

export async function POST(request: Request) {
    const expectedSecret = process.env.CACHE_REVALIDATE_SECRET;
    if (!expectedSecret) {
        return Response.json(
            { error: "CACHE_REVALIDATE_SECRET is not configured." },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const requestSecret = bearerToken ?? request.headers.get("x-revalidate-secret");

    if (requestSecret !== expectedSecret) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isValidPayload(body)) {
        return Response.json(
            {
                error: "Invalid payload. Expected domain of blogs, projects, sitemap, or llms.",
            },
            { status: 400 }
        );
    }

    const tags = getTagsToRevalidate(body);
    if (tags.length === 0) {
        return Response.json({ error: "No cache tags matched the request." }, { status: 400 });
    }

    const uniqueTags = [...new Set(tags)];
    for (const tag of uniqueTags) {
        revalidateTag(tag, "max");
    }

    return Response.json({
        revalidated: true,
        tags: uniqueTags,
        now: Date.now(),
    });
}
