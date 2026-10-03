import "server-only";
import { type NextRequest } from "next/server";

/**
 * Access control for the Studio.
 *
 * `STUDIO_PASSWORD` is the only requirement. When it is unset the Studio is
 * reachable from local development only — on any deployed environment it is
 * refused outright, because the Studio can write to the CDN bucket and an open
 * deploy would let anyone upload to it.
 */

const COOKIE_NAME = "studio_session";
const SESSION_TTL_DAYS = 30;

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
 * Compares two secrets without leaking their length or contents through timing.
 *
 * @returns `true` when both strings are identical.
 */
function timingSafeEqual(a: string, b: string): boolean {
    const encoder = new TextEncoder();
    const left = encoder.encode(a);
    const right = encoder.encode(b);
    if (left.length !== right.length) return false;

    let mismatch = 0;
    for (let i = 0; i < left.length; i++) {
        mismatch |= left[i] ^ right[i];
    }
    return mismatch === 0;
}

/** Whether the supplied password matches `STUDIO_PASSWORD`. */
export function checkStudioPassword(password: string): boolean {
    const expected = process.env.STUDIO_PASSWORD;
    if (!expected) return false;
    return timingSafeEqual(password, expected);
}

/**
 * Whether a request may read or mutate Studio data.
 *
 * Local development is allowed without a password so the editor can be used
 * offline; everywhere else a valid session cookie is required.
 */
export function isStudioAuthorized(request: NextRequest): boolean {
    return isStudioAuthorizedCookie(request.cookies.get(COOKIE_NAME)?.value);
}

/**
 * Cookie-based variant for server components, which read cookies through
 * `next/headers` rather than a `NextRequest`.
 */
export function isStudioAuthorizedCookie(cookieValue: string | undefined): boolean {
    // No password configured means development only; deployed environments are
    // never authorized without one.
    if (!process.env.STUDIO_PASSWORD) {
        return isLocalDev();
    }

    if (!cookieValue) return false;
    return checkStudioPassword(cookieValue);
}
