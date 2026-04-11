import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Keep a single canonical URL for the default locale home and child paths.
    if (pathname === "/en" || pathname.startsWith("/en/")) {
        const url = request.nextUrl.clone();
        url.pathname = pathname === "/en" ? "/" : pathname.replace(/^\/en/, "");
        return NextResponse.redirect(url, 301);
    }

    return handleI18nRouting(request);
}

export const config = {
    // Skip all paths that should not be internationalized. This example skips the
    // folders "api", "trpc", "_next" and all files with an extension (e.g. favicon.ico)
    // Also, don't match routes under blog
    matcher: "/((?!api|trpc|_next|_vercel|blog|project|relay-5woc|.*\\..*).*)",
};
