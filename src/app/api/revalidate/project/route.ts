import { revalidateTag } from "next/cache";
import { type NextRequest } from "next/server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isAuthorized } from "../_auth";

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
    }

    revalidateTag(CACHE_TAGS.projects, { expire: 0 });

    return Response.json({
        revalidated: true,
    });
}