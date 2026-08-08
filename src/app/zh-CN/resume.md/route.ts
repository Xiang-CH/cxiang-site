import { serveResumeMarkdown } from "@/lib/resume-markdown";

/** A stable, shareable URL that serves the Chinese résumé markdown directly. */
export async function GET() {
    return serveResumeMarkdown(
        "https://cdn.cxiang.site/%E9%99%88%E6%83%B3-%E7%AE%80%E5%8E%86.md",
        "resume_chen_xiang.md",
        "陈想-简历.md"
    );
}
