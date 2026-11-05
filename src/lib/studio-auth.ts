import "server-only";
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";

/**
 * Access control for the Studio.
 *
 * `STUDIO_PASSWORD` is the only requirement. When it is unset the Studio is
 * reachable from local development only — on any deployed environment it is
 * refused outright, because the Studio can write to the CDN bucket and an open
 * deploy would let anyone upload to it.
 *
 * The session cookie never carries the password. It carries an HMAC over a fixed
 * payload, so a copied or logged cookie does not disclose the credential and
 * rotating the key invalidates every existing session.
 */

const COOKIE_NAME = "studio_session";
const SESSION_TTL_DAYS = 30;

/**
 * Prefix for the signed session payload.
 *
 * The version suffix lets the format change later without accepting old tokens.
 */
const SESSION_PAYLOAD_PREFIX = "studio-session-v1";

function isLocalDev(): boolean {
    return process.env.NODE_ENV === "development";
}

/** Whether the Studio can be used at all in this environment. */
export function isStudioEnabled(): boolean {
    return Boolean(process.env.STUDIO_PASSWORD) || isLocalDev();
}

export function studioCookieName(): string {
    return COOKIE_NAME;
}

export function studioSessionMaxAgeSeconds(): number {
    return SESSION_TTL_DAYS * 24 * 60 * 60;
}

/** Millisecond lifetime of a session token, matching the cookie's `maxAge`. */
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** `v1.<issuedAtMs>.<hmac>` — the issue time is signed so it cannot be edited. */
function sessionPayload(issuedAtMs: number): string {
    return `${SESSION_PAYLOAD_PREFIX}.${issuedAtMs}`;
}

/**
 * The key used to sign the session cookie.
 *
 * Prefers a dedicated secret so `STUDIO_PASSWORD` can be rotated without also
 * invalidating sessions, and falls back to the password so a single environment
 * variable keeps working.
 */
function sessionKey(): string | null {
    const secret = process.env.STUDIO_SESSION_SECRET || process.env.STUDIO_PASSWORD;
    return secret || null;
}

/**
 * Builds the cookie value for a session issued now.
 *
 * The issue time is part of the signed payload, so a copied token stops working
 * when it expires instead of staying valid until the signing key changes.
 *
 * @param nowMs - Issue time, injectable for tests.
 * @returns The token, or `null` when no key is configured.
 */
export function createStudioSessionToken(nowMs: number = Date.now()): string | null {
    const key = sessionKey();
    if (!key) return null;
    const issuedAt = Math.floor(nowMs);
    const signature = createHmac("sha256", key).update(sessionPayload(issuedAt)).digest("hex");
    return `${SESSION_PAYLOAD_PREFIX}.${issuedAt}.${signature}`;
}

/**
 * Verifies a presented token: correct signature, and still within its lifetime.
 *
 * @param token - The cookie value.
 * @param nowMs - Current time, injectable for tests.
 */
export function verifyStudioSessionToken(
    token: string | undefined,
    nowMs: number = Date.now()
): boolean {
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== SESSION_PAYLOAD_PREFIX) return false;

    const issuedAt = Number(parts[1]);
    if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
    // A token from the future cannot be trusted; allow a little clock skew.
    if (issuedAt > nowMs + 60_000) return false;
    if (nowMs - issuedAt > SESSION_TTL_MS) return false;

    const key = sessionKey();
    if (!key) return false;
    const expected = createHmac("sha256", key).update(sessionPayload(issuedAt)).digest("hex");
    return timingSafeEqual(parts[2], expected);
}

/** Length-safe constant-time comparison of two strings. */
function timingSafeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a, "utf8");
    const right = Buffer.from(b, "utf8");
    // `timingSafeEqual` throws on a length mismatch, so guard first; the length
    // of an HMAC is not secret.
    if (left.length !== right.length) return false;
    return nodeTimingSafeEqual(left, right);
}

/** Whether the supplied password matches `STUDIO_PASSWORD`. */
export function checkStudioPassword(password: string): boolean {
    const expected = process.env.STUDIO_PASSWORD;
    if (!expected) return false;
    return timingSafeEqual(password, expected);
}

/**
 * Whether a presented cookie value authorizes Studio access.
 *
 * Local development is allowed without a password so the editor can be used
 * offline; everywhere else a valid session token is required.
 */
export function isStudioAuthorizedToken(cookieValue: string | undefined): boolean {
    if (!process.env.STUDIO_PASSWORD) {
        // No password configured means development only; deployed environments
        // are never authorized without one.
        return isLocalDev();
    }

    return verifyStudioSessionToken(cookieValue);
}

/** Route-handler variant, which has a `NextRequest` available. */
export function isStudioAuthorized(request: NextRequest): boolean {
    return isStudioAuthorizedToken(request.cookies.get(COOKIE_NAME)?.value);
}

/**
 * Cookie-based variant for server components, which read cookies through
 * `next/headers` rather than a `NextRequest`.
 */
export async function isStudioAuthorizedCookie(cookieValue: string | undefined): Promise<boolean> {
    return isStudioAuthorizedToken(cookieValue);
}
