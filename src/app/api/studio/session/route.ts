import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
    checkStudioPassword,
    createStudioSessionToken,
    isStudioEnabled,
    studioCookieName,
    studioSessionMaxAgeSeconds,
} from "@/lib/studio-auth";

const payloadSchema = z.object({ password: z.string().min(1).max(500) });

/**
 * Exchanges the Studio password for an httpOnly session cookie.
 *
 * The cookie stores the password itself: the server compares it with
 * `STUDIO_PASSWORD` on every request, so no session table is needed for a
 * single-author site.
 */
export async function POST(request: NextRequest) {
    if (!isStudioEnabled() || !process.env.STUDIO_PASSWORD) {
        return NextResponse.json(
            { error: "The Studio is disabled on this environment." },
            { status: 403 }
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
        return NextResponse.json({ error: "A password is required" }, { status: 400 });
    }

    if (!checkStudioPassword(parsed.data.password)) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // The cookie carries a derived token, never the password itself, so a
    // copied or logged cookie does not disclose the credential.
    const token = createStudioSessionToken();
    if (!token) {
        return NextResponse.json({ error: "The Studio is not configured." }, { status: 503 });
    }

    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set({
        name: studioCookieName(),
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: studioSessionMaxAgeSeconds(),
    });
    return response;
}

/** Clears the session cookie. */
export async function DELETE() {
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set({
        name: studioCookieName(),
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
    return response;
}
