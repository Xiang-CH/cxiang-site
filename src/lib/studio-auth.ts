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
 * Value the session HMAC is computed over.
 *
 * Signing a constant rather than a timestamp keeps verification stateless: the
 * expected token is recomputed on each request and compared.
 */
const SESSION_PAYLOAD = "studio-session-v1";

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
 * The cookie value a correctly authenticated session must present.
 *
 * @returns The token, or `null` when no key is configured.
 */
export function createStudioSessionToken(): string | null {
    const key = sessionKey();
    if (!key) return null;
    return createHmac("sha256", key).update(SESSION_PAYLOAD).digest("hex");
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

    if (!cookieValue) return false;
    const expected = createStudioSessionToken();
    return expected !== null && timingSafeEqual(cookieValue, expected);
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
