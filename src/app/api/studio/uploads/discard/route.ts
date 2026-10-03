import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deletePhotoObject, isPhotoStorageConfigured } from "@/lib/cdn-storage";
import { isStudioAuthorized } from "@/lib/studio-auth";

const payloadSchema = z.object({ storageKey: z.string().min(1).max(1000) });

/**
 * Removes an uploaded object that was never attached to a photoset.
 *
 * Without this, a photo uploaded and then discarded in the editor would stay in
 * the bucket forever: the regular cleanup path only runs for photos that were
 * once saved. The key is validated against the photo prefix before any delete.
 */
export async function POST(request: NextRequest) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPhotoStorageConfigured) {
        return NextResponse.json({ error: "Photo storage is not configured" }, { status: 503 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
    }

    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "A storageKey is required" }, { status: 400 });
    }

    try {
        const deleted = await deletePhotoObject(parsed.data.storageKey);
        if (!deleted) {
            // The key was outside the photo prefix or otherwise unsafe.
            return NextResponse.json({ error: "Refused to delete that key" }, { status: 400 });
        }
        return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("Failed to discard upload", error);
        return NextResponse.json({ error: "Could not discard the upload" }, { status: 502 });
    }
}
