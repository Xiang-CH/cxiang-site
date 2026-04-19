import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prefersMarkdown } from "./lib/accept";
import { htmlPathnameFromMarkdown } from "./lib/llms";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === "/sitemap.md") {
        return NextResponse.next();
    }

    // Explicit markdown mirrors (e.g. `/blog/my-post.md`) are rewritten to the
    // same backend markdown builder as content negotiation so agents can choose
    // either URL style.
    if (pathname.endsWith(".md")) {
        const htmlPathname = htmlPathnameFromMarkdown(pathname);
        const url = request.nextUrl.clone();
        url.pathname = `/api/md${htmlPathname === "/" ? "" : htmlPathname}`;
        url.search = "";
        return NextResponse.rewrite(url);
    }

    // Markdown content negotiation: agents that send `Accept: text/markdown`
    // get rewritten to a Route Handler that runs under the normal Node.js
    // server runtime (where `"use cache"` + `cacheTag` work). Browsers keep
    // hitting the HTML pages unchanged. A rewrite is invisible to the client
    // -- same URL, different response body.
    if (prefersMarkdown(request.headers.get("accept"))) {
        const url = request.nextUrl.clone();
        url.pathname = `/api/md${pathname === "/" ? "" : pathname}`;
        // Query string is intentionally dropped: markdown generation is
        // path-only, and preserving ?utm=... would needlessly fragment the
        // CDN cache key.
        url.search = "";
        const resp = NextResponse.rewrite(url);
        resp.headers.set("Vary", "Accept");
        return resp;
    }

    // `/blog` and `/project` aren't localized; skip i18n routing for them.
    if (pathname.startsWith("/blog") || pathname.startsWith("/project")) {
        return NextResponse.next();
    }

    return handleI18nRouting(request);
}

export const config = {
    // Main matcher excludes file-like assets; second matcher opts `.md` pages
    // back in so route-level markdown mirrors work at stable URLs.
    matcher: [
        "/((?!api|trpc|_next|_vercel|relay-5woc|.*\\..*).*)",
        "/((?!api|trpc|_next|_vercel|relay-5woc).*)\\.md",
    ],
};
