import { MARKDOWN_CACHE_CONTROL, canonicalLinkHeaderForPath, estimateTokens } from "@/lib/llms";
import { buildSitemapMarkdown } from "@/lib/llms-notion";

export async function GET() {
    const body = await buildSitemapMarkdown();

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "x-markdown-tokens": String(estimateTokens(body)),
            "Cache-Control": MARKDOWN_CACHE_CONTROL,
            Link: canonicalLinkHeaderForPath("/sitemap.xml"),
        },
    });
}
