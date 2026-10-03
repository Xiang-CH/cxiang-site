import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    createStudioSessionToken,
    isStudioAuthorizedToken,
    studioSessionMaxAgeSeconds,
    verifyStudioSessionToken,
} from "./studio-auth";

/**
 * The session cookie must never carry `STUDIO_PASSWORD`, and a token must stop
 * being accepted once the password or session secret changes.
 */
describe("studio session tokens", () => {
    const original = {
        password: process.env.STUDIO_PASSWORD,
        secret: process.env.STUDIO_SESSION_SECRET,
        nodeEnv: process.env.NODE_ENV,
    };

    beforeEach(() => {
        process.env.STUDIO_PASSWORD = "correct horse battery staple";
        delete process.env.STUDIO_SESSION_SECRET;
    });

    afterEach(() => {
        if (original.password === undefined) delete process.env.STUDIO_PASSWORD;
        else process.env.STUDIO_PASSWORD = original.password;

        if (original.secret === undefined) delete process.env.STUDIO_SESSION_SECRET;
        else process.env.STUDIO_SESSION_SECRET = original.secret;
    });

    it("does not put the password in the cookie", () => {
        const token = createStudioSessionToken();
        expect(token).toBeTruthy();
        expect(token).not.toBe(process.env.STUDIO_PASSWORD);
        expect(token).not.toContain("correct");
    });

    it("embeds a signed issue time so tokens can expire", () => {
        const token = createStudioSessionToken(1_700_000_000_000)!;
        expect(token.startsWith("studio-session-v1.1700000000000.")).toBe(true);
    });

    it("accepts a fresh token and rejects one past its lifetime", () => {
        const issuedAt = 1_700_000_000_000;
        const token = createStudioSessionToken(issuedAt)!;
        const ttlMs = studioSessionMaxAgeSeconds() * 1000;

        expect(verifyStudioSessionToken(token, issuedAt)).toBe(true);
        expect(verifyStudioSessionToken(token, issuedAt + ttlMs - 1000)).toBe(true);
        // A copied token must stop working once the cookie would have expired.
        expect(verifyStudioSessionToken(token, issuedAt + ttlMs + 1)).toBe(false);
    });

    it("rejects a token whose issue time was tampered with", () => {
        const token = createStudioSessionToken(1_700_000_000_000)!;
        const [, , signature] = token.split(".");
        const forged = `studio-session-v1.${Date.now()}.${signature}`;
        expect(verifyStudioSessionToken(forged)).toBe(false);
    });

    it("rejects malformed and future-dated tokens", () => {
        expect(verifyStudioSessionToken("studio-session-v1.notanumber.abc")).toBe(false);
        expect(verifyStudioSessionToken("studio-session-v1.1700000000000")).toBe(false);
        expect(verifyStudioSessionToken("garbage")).toBe(false);
        const future = createStudioSessionToken(Date.now() + 10 * 60 * 1000)!;
        expect(verifyStudioSessionToken(future)).toBe(false);
    });

    it("accepts its own token and rejects anything else", () => {
        const token = createStudioSessionToken()!;
        expect(isStudioAuthorizedToken(token)).toBe(true);
        expect(isStudioAuthorizedToken("guess")).toBe(false);
        expect(isStudioAuthorizedToken("")).toBe(false);
        expect(isStudioAuthorizedToken(undefined)).toBe(false);
        // The password itself must not be accepted as a session token.
        expect(isStudioAuthorizedToken(process.env.STUDIO_PASSWORD)).toBe(false);
    });

    it("invalidates existing sessions when the password is rotated", () => {
        const before = createStudioSessionToken()!;
        process.env.STUDIO_PASSWORD = "a different password";
        const after = createStudioSessionToken();

        expect(after).not.toBe(before);
        expect(isStudioAuthorizedToken(before)).toBe(false);
    });

    it("prefers a dedicated session secret so the password can rotate alone", () => {
        process.env.STUDIO_SESSION_SECRET = "a stable signing key";
        const token = createStudioSessionToken()!;

        // Rotating the password keeps sessions alive while the key is unchanged.
        process.env.STUDIO_PASSWORD = "rotated";
        expect(createStudioSessionToken()).toBe(token);
        expect(isStudioAuthorizedToken(token)).toBe(true);

        // Rotating the key does invalidate them.
        process.env.STUDIO_SESSION_SECRET = "a new signing key";
        expect(isStudioAuthorizedToken(token)).toBe(false);
    });

    it("has no token when nothing is configured", () => {
        delete process.env.STUDIO_PASSWORD;
        delete process.env.STUDIO_SESSION_SECRET;
        expect(createStudioSessionToken()).toBeNull();
    });
});
