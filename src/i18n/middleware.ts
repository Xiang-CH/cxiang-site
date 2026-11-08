import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./routing";

const defaultMiddleware = createMiddleware(routing);
const explicitLocaleMiddleware = createMiddleware({ ...routing, localePrefix: "always" });

export function handleI18nRouting(request: NextRequest) {
    const prefix = request.nextUrl.pathname.split("/")[1];
    // Keep /en and /zh-CN as separate client-router cache entries. In particular,
    // /en must not redirect through /, whose locale depends on the current cookie.
    // Apply this equally to HTML and RSC requests; Proxy strips internal headers.
    if (prefix && routing.locales.includes(prefix)) {
        return explicitLocaleMiddleware(request);
    }
    return defaultMiddleware(request);
}
