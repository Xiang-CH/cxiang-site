import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

// Use the same locale handling for document and client navigation requests.
// Next.js strips internal prefetch/RSC headers before invoking Proxy.
export const handleI18nRouting = createMiddleware(routing);
