import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
    // Skip all paths that should not be internationalized. This example skips the
    // folders "api", "trpc", "_next" and all files with an extension (e.g. favicon.ico)
    // Also, don't match routes under blog
    matcher: "/((?!api|trpc|_next|_vercel|blog|project|relay-5woc|.*\\..*).*)",
};
