import { NextRequest } from "next/server";

function getSecret(request: NextRequest): string | null {
    const headerSecret = request.headers.get("x-revalidate-secret");
    if (headerSecret) {
        return headerSecret;
    }

    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
        return authorization.slice("Bearer ".length);
    }

    return null;
}

export function isAuthorized(req: NextRequest) {
    const expectedSecret = process.env.BLOG_REVALIDATION_SECRET;
    const providedSecret = getSecret(req);
    return !!expectedSecret && providedSecret === expectedSecret;
}