import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { photosetInputSchema, validateShotRange } from "@/lib/photoset-payload";
import {
    deletePhotoSet,
    DuplicateSlugError,
    listPhotoSets,
    savePhotoSet,
    StudioUnavailableError,
} from "@/lib/studio";
import { isStudioAuthorized } from "@/lib/studio-auth";

/** Lists every photoset, drafts included, for the Studio index. */
export async function GET(request: NextRequest) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sets = await listPhotoSets();
        return NextResponse.json({ sets }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof StudioUnavailableError) {
            return NextResponse.json({ error: error.message }, { status: 503 });
        }
        console.error("Failed to list photosets", error);
        return NextResponse.json({ error: "Could not load photosets" }, { status: 500 });
    }
}

type SaveBody = {
    id?: string;
    photoset?: unknown;
};

/** Creates or replaces a photoset. Pass `id` to update an existing one. */
export async function POST(request: NextRequest) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: SaveBody;
    try {
        body = (await request.json()) as SaveBody;
    } catch {
        return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
    }

    const parsed = photosetInputSchema.safeParse(body.photoset);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid photoset" },
            { status: 400 }
        );
    }

    const rangeError = validateShotRange(parsed.data);
    if (rangeError) {
        return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    try {
        const { id } = await savePhotoSet(body.id ?? null, parsed.data);
        revalidateTag(CACHE_TAGS.photos, { expire: 0 });
        revalidateTag(CACHE_TAGS.sitemap, { expire: 0 });
        return NextResponse.json({ id }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof DuplicateSlugError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        if (error instanceof StudioUnavailableError) {
            return NextResponse.json({ error: error.message }, { status: 503 });
        }
        console.error("Failed to save photoset", error);
        return NextResponse.json({ error: "Could not save the photoset" }, { status: 500 });
    }
}

/** Deletes a photoset and its photos. */
export async function DELETE(request: NextRequest) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "An id is required" }, { status: 400 });
    }

    try {
        const deleted = await deletePhotoSet(id);
        if (!deleted) {
            return NextResponse.json({ error: "Photoset not found" }, { status: 404 });
        }
        revalidateTag(CACHE_TAGS.photos, { expire: 0 });
        revalidateTag(CACHE_TAGS.sitemap, { expire: 0 });
        return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        if (error instanceof StudioUnavailableError) {
            return NextResponse.json({ error: error.message }, { status: 503 });
        }
        console.error("Failed to delete photoset", error);
        return NextResponse.json({ error: "Could not delete the photoset" }, { status: 500 });
    }
}
