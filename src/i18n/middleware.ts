import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./routing";

const navigationMiddleware = createMiddleware(routing);
const prefetchMiddleware = createMiddleware({ ...routing, localeCookie: false });

export function handleI18nRouting(request: NextRequest) {
    // Prefetching another language must not persist a preference before selection.
    const isPrefetch =
        request.headers.has("next-router-prefetch") ||
        request.headers.get("purpose") === "prefetch";
    return (isPrefetch ? prefetchMiddleware : navigationMiddleware)(request);
}
