import { NextRequest, NextResponse } from "next/server";
import {
    BLOG_STATS_COOKIE_MAX_AGE,
    BLOG_STATS_VISITOR_COOKIE,
    createVisitorId,
    isBlogStatsConfigured,
    isValidBlogSlug,
    isVisitorId,
    toggleBlogLike,
} from "@/lib/blog-stats";
import { BLOG_STATS_MUTATION_CACHE_CONTROL } from "@/lib/blog-stats-cache";

type Context = { params: Promise<{ slug: string }> };

function isSameOrigin(request: NextRequest) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    return origin === request.nextUrl.origin && (!fetchSite || fetchSite === "same-origin");
}

export async function POST(request: NextRequest, { params }: Context) {
    const { slug } = await params;
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isValidBlogSlug(slug)) {
        return NextResponse.json({ error: "Invalid blog slug" }, { status: 400 });
    }
    if (!isBlogStatsConfigured()) {
        return NextResponse.json({ error: "Blog statistics are unavailable" }, { status: 503 });
    }

    const existingVisitorId = request.cookies.get(BLOG_STATS_VISITOR_COOKIE)?.value;
    const visitorId = isVisitorId(existingVisitorId) ? existingVisitorId : createVisitorId();

    try {
        const stats = await toggleBlogLike(slug, visitorId);
        const response = NextResponse.json(stats, {
            headers: { "Cache-Control": BLOG_STATS_MUTATION_CACHE_CONTROL },
        });

        if (visitorId !== existingVisitorId) {
            response.cookies.set(BLOG_STATS_VISITOR_COOKIE, visitorId, {
                httpOnly: true,
                maxAge: BLOG_STATS_COOKIE_MAX_AGE,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        }

        return response;
    } catch (error) {
        console.error("Unable to toggle blog like", error);
        return NextResponse.json({ error: "Blog statistics are unavailable" }, { status: 503 });
    }
}
