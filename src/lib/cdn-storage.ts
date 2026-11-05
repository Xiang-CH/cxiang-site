import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    assertSafeStorageKey as assertSafeKey,
    buildStorageKey as buildKey,
    normalizePhotoPrefix,
} from "@/lib/cdn-storage-keys";

/**
 * S3-compatible object storage for photographs (Cloudflare R2).
 *
 * Uploads go straight from the browser to the bucket using a presigned PUT:
 * Vercel caps serverless request bodies at 4.5 MB, which most photos exceed, so
 * proxying the bytes through a route handler would fail in production.
 */

const endpoint = process.env.CDN_S3_ENDPOINT;
const accessKeyId = process.env.CDN_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.CDN_S3_SECRET_ACCESS_KEY;
const bucket = process.env.CDN_S3_BUCKET;
const publicBaseUrl = process.env.CDN_PUBLIC_BASE_URL?.replace(/\/$/, "");
const keyPrefix = normalizePhotoPrefix(process.env.CDN_PHOTO_PREFIX);

/** Whether the Studio can upload. Public pages never depend on this. */
export const isPhotoStorageConfigured = Boolean(
    endpoint && accessKeyId && secretAccessKey && bucket && publicBaseUrl
);

/** Human-readable list of the variables that are still missing. */
export function missingStorageEnvVars(): string[] {
    const required: Array<[string, string | undefined]> = [
        ["CDN_S3_ENDPOINT", endpoint],
        ["CDN_S3_ACCESS_KEY_ID", accessKeyId],
        ["CDN_S3_SECRET_ACCESS_KEY", secretAccessKey],
        ["CDN_S3_BUCKET", bucket],
        ["CDN_PUBLIC_BASE_URL", publicBaseUrl],
    ];
    return required.filter(([, value]) => !value).map(([name]) => name);
}

let client: S3Client | null = null;

function getClient(): S3Client {
    if (client) return client;
    if (!isPhotoStorageConfigured) {
        throw new Error(`Photo storage is not configured (${missingStorageEnvVars().join(", ")})`);
    }
    // R2 ignores the region but the SDK requires one.
    client = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
    return client;
}

/** Public URL for an object key, served by the CDN. */
export function publicUrlFor(key: string): string {
    if (!publicBaseUrl) {
        throw new Error("CDN_PUBLIC_BASE_URL is not configured");
    }
    return `${publicBaseUrl}/${key}`;
}

/** Presigned PUT the browser uses to upload one photo. */
export async function createUploadUrl(
    filename: string,
    contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; storageKey: string }> {
    const storageKey = buildKey(filename, Date.now(), keyPrefix);
    const uploadUrl = await getSignedUrl(
        getClient(),
        new PutObjectCommand({
            Bucket: bucket,
            Key: storageKey,
            ContentType: contentType,
        }),
        { expiresIn: 900 }
    );

    return { uploadUrl, publicUrl: publicUrlFor(storageKey), storageKey };
}

/** Removes an uploaded object. Returns `false` when the key is not a safe photo key. */
export async function deletePhotoObject(storageKey: string): Promise<boolean> {
    const safeKey = assertSafeKey(storageKey, keyPrefix);
    if (!safeKey) return false;

    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: safeKey }));
    return true;
}
