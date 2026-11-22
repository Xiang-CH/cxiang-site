import { NextResponse, type NextRequest } from "next/server";
import { getPhotoSetForEditing, StudioUnavailableError } from "@/lib/studio";
import { isStudioAuthorized } from "@/lib/studio-auth";

/** Loads one photoset — including drafts — for the Studio editor. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const photoset = await getPhotoSetForEditing(id);
        if (!photoset) {
            return NextResponse.json({ error: "Photoset not found" }, { status: 404 });
        }
        return NextResponse.json({ photoset }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof StudioUnavailableError) {
            return NextResponse.json({ error: error.message }, { status: 503 });
        }
        console.error("Failed to load photoset", error);
        return NextResponse.json({ error: "Could not load the photoset" }, { status: 500 });
    }
}
