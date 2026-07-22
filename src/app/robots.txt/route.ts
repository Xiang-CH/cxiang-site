const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";

/**
 * Generates the site's robots.txt response with crawler directives and a sitemap URL.
 *
 * @returns An HTTP response containing the robots.txt content.
 */
export function GET() {
    const body = [
        "User-Agent: *",
        "Content-Signal: search=yes, ai-input=yes, ai-train=no",
        "Allow: /",
        "Disallow: /cli",
        "Disallow: /en/cli",
        "Disallow: /zh-CN/cli",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
    ].join("\n");

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
