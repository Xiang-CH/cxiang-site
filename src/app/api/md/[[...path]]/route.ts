import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { buildMarkdownForPath, markdownResponse, resolveLocale } from "@/lib/llms";
import { getAllPostsMeta } from "@/lib/notion";

/**
 * Pre-render every known markdown URL at build time so the first real request
 * never waits on Notion. Unknown paths (new blog slugs) still render on demand
 * because `dynamicParams` defaults to `true`.
 *
 * The set of URLs mirrors what `proxy.ts` rewrites to: for each supported
 * route we register both the unprefixed variant (production canonical URL)
 * and the locale-prefixed variant (used by dev / next-intl before the default
 * locale redirect kicks in).
 */
export async function generateStaticParams(): Promise<{ path: string[] }[]> {
    const metas = await getAllPostsMeta();
    const locales = routing.locales;
    const params: { path: string[] }[] = [];

    params.push({ path: [] });
    for (const locale of locales) {
        params.push({ path: [locale] });
    }

    for (const base of ["blog", "project"] as const) {
        params.push({ path: [base] });
        for (const locale of locales) {
            params.push({ path: [locale, base] });
        }
    }

    for (const meta of metas) {
        params.push({ path: ["blog", meta.slug] });
        for (const locale of locales) {
            params.push({ path: [locale, "blog", meta.slug] });
        }
    }

    return params;
}

/**
 * Markdown content-negotiation endpoint. The proxy rewrites
 * `Accept: text/markdown` requests to `/api/md${pathname}` so that Notion
 * builders can run under the normal Node.js server runtime (the Middleware /
 * Proxy bundle strips `"use cache"` directives, so builders must not be
 * reachable from `proxy.ts`).
 */
export async function GET(req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
    const { path } = await params;
    const pathname = path && path.length > 0 ? `/${path.join("/")}` : "/";
    const locale = resolveLocale(pathname);

    const result = await buildMarkdownForPath(pathname, locale);

    if (result.kind === "notFound") {
        return new Response("Not Found", {
            status: 404,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                Vary: "Accept",
            },
        });
    }

    if (result.kind === "redirect") {
        // Redirect to the canonical HTML URL; the proxy will re-rewrite it
        // to `/api/md/<canonical>` once the agent follows the 301 with the
        // same `Accept: text/markdown` header.
        const url = new URL(result.to, req.url);
        return NextResponse.redirect(url, 301);
    }

    return markdownResponse(result.body);
}
