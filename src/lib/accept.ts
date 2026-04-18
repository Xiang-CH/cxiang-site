/**
 * Accept-header helpers shared by the Proxy (Edge/Middleware runtime) and the
 * Route Handlers. Must not import any server-only modules so it's safe to
 * include in the Proxy bundle.
 */

/**
 * Parse the q-value for a specific mime type out of an Accept header.
 * Returns 0 if the type is absent, 1 if present without an explicit q-value,
 * and the parsed q-value otherwise.
 */
function qValue(accept: string, mime: string): number {
    const target = mime.toLowerCase();
    for (const raw of accept.split(",")) {
        const parts = raw
            .trim()
            .split(";")
            .map((s) => s.trim());
        const type = parts.shift()?.toLowerCase();
        if (type !== target) continue;
        for (const param of parts) {
            const m = param.match(/^q=([\d.]+)$/i);
            if (m) {
                const q = Number.parseFloat(m[1]);
                return Number.isFinite(q) ? q : 0;
            }
        }
        return 1;
    }
    return 0;
}

/**
 * Returns true if the client's Accept header lists `text/markdown` with a
 * q-value at least as high as `text/html`. `*\/*` and missing headers do NOT
 * trigger markdown negotiation -- the markdown surface is opt-in.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
    if (!accept) return false;
    const md = qValue(accept, "text/markdown");
    if (md <= 0) return false;
    const html = qValue(accept, "text/html");
    return md >= html;
}
