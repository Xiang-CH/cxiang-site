import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { syncRecentVercelBlogPageviews } from "@/lib/vercel-blog-analytics";

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isDatabaseConfigured()) {
        return NextResponse.json({ error: "Blog statistics are unavailable" }, { status: 503 });
    }

    try {
        const result = await syncRecentVercelBlogPageviews();
        revalidateTag(CACHE_TAGS.blogStats, "max");
        return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("Unable to sync Vercel blog analytics", error);
        return NextResponse.json({ error: "Blog analytics sync failed" }, { status: 503 });
    }
}
