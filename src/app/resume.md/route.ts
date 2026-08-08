import { serveResumeMarkdown } from "@/lib/resume-markdown";

/** A stable, shareable URL that serves the English résumé markdown directly. */
export async function GET() {
    return serveResumeMarkdown(
        "https://cdn.cxiang.site/resume_chen_xiang.md",
        "resume_chen_xiang.md"
    );
}
