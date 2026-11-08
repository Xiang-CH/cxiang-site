import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./routing";

const navigationMiddleware = createMiddleware(routing);
// Keep explicit locale prefixes while prefetching. Redirecting /en to / would
// re-detect the old cookie and cache Chinese content under the English target.
const prefetchMiddleware = createMiddleware({
    ...routing,
    localeCookie: false,
    localePrefix: "always",
});

export function handleI18nRouting(request: NextRequest) {
    // Prefetching another language must not persist a preference before selection.
    const isPrefetch =
        request.headers.has("next-router-prefetch") ||
        request.headers.get("purpose") === "prefetch";
    return (isPrefetch ? prefetchMiddleware : navigationMiddleware)(request);
}
