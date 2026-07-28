import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { getPublicBlogStats, isValidBlogSlug } from "@/lib/blog-stats";

const MAX_SLUGS_PER_REQUEST = 100;

export async function GET(request: NextRequest) {
    const slugs = [...new Set(request.nextUrl.searchParams.getAll("slug"))];

    if (slugs.length > MAX_SLUGS_PER_REQUEST || slugs.some((slug) => !isValidBlogSlug(slug))) {
        return NextResponse.json({ error: "Invalid blog slugs" }, { status: 400 });
    }
    if (!isDatabaseConfigured()) {
        return NextResponse.json({ error: "Blog statistics are unavailable" }, { status: 503 });
    }

    try {
        return NextResponse.json(
            { stats: await getPublicBlogStats(slugs) },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("Unable to load blog statistics", error);
        return NextResponse.json({ error: "Blog statistics are unavailable" }, { status: 503 });
    }
}
