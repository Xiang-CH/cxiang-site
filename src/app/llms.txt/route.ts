import { MARKDOWN_CACHE_CONTROL, estimateTokens } from "@/lib/llms";
import { buildLlmsIndex } from "@/lib/llms-notion";

/**
 * Single root `/llms.txt` endpoint, following the https://llmstxt.org spec:
 * one markdown document at the site root listing the site's pages so agents
 * can discover content without crawling the HTML tree.
 *
 * The handler doesn't read any request headers, which lets Next pre-render
 * it as a fully static asset (the inner builder is still `"use cache"`-wrapped
 * and tagged for Notion-driven revalidation).
 */
export async function GET() {
    const body = await buildLlmsIndex();
    return new Response(body, {
        status: 200,
        headers: {
            // `.txt` extension => browsers display inline as plain text, but
            // the body itself is markdown per spec.
            "Content-Type": "text/plain; charset=utf-8",
            "x-markdown-tokens": String(estimateTokens(body)),
            "Cache-Control": MARKDOWN_CACHE_CONTROL,
        },
    });
}
