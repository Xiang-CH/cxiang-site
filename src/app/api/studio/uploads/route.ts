import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
    createUploadUrl,
    isPhotoStorageConfigured,
    missingStorageEnvVars,
} from "@/lib/cdn-storage";
import { isStudioAuthorized } from "@/lib/studio-auth";

const payloadSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z
        .string()
        .regex(
            /^image\/(jpeg|png|webp|avif|gif)$/,
            "Only JPEG, PNG, WebP, AVIF and GIF are allowed."
        ),
});

/**
 * Issues a presigned CDN upload URL for one photo.
 *
 * The browser PUTs the file straight to the bucket, then saves the returned
 * `publicUrl` through the photoset endpoint. Bytes never pass through the
 * server, which is required because Vercel caps request bodies at 4.5 MB.
 */
export async function POST(request: NextRequest) {
    if (!isStudioAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPhotoStorageConfigured) {
        return NextResponse.json(
            {
                error: `Photo storage is not configured. Missing: ${missingStorageEnvVars().join(
                    ", "
                )}`,
            },
            { status: 503 }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
    }

    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid upload request" },
            { status: 400 }
        );
    }

    try {
        const ticket = await createUploadUrl(parsed.data.filename, parsed.data.contentType);
        return NextResponse.json(ticket, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("Failed to create upload URL", error);
        return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
    }
}
