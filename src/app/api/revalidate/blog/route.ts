import { revalidateTag } from "next/cache";
import { type NextRequest } from "next/server";
import { CACHE_TAGS, getBlogTag } from "@/lib/cache-tags";
import { getSlugById } from "@/lib/notion";
import { isAuthorized } from "../_auth";

type RevalidateBody = {
    slug?: string;
    id?: string;
};

function buildTags() {
    const tags = new Set<string>([CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.sitemap]);

    return [...tags];
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
    }

    const tags = buildTags();
    for (const tag of tags) {
        revalidateTag(tag, { expire: 0 });
    }

    return Response.json({
        revalidated: true,
        tags,
    });
}

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
    }

    let body: RevalidateBody = {};
    try {
        body = (await request.json()) as RevalidateBody;
    } catch {
        body = {};
    }

    const requestedSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const requestedId = typeof body.id === "string" ? body.id.trim() : "";
    const resolvedSlug = requestedSlug || (requestedId ? await getSlugById(requestedId) : null);
    
    if (!resolvedSlug) {
        return Response.json({ revalidated: false, message: "Invalid slug or ID" }, { status: 400 });
    }

    const tags = getBlogTag(resolvedSlug);

    for (const tag of tags) {
        revalidateTag(tag, { expire: 0 });
    }

    return Response.json({
        revalidated: true,
        tags,
        slug: resolvedSlug,
    });
}
