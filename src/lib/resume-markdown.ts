import { MARKDOWN_CACHE_CONTROL } from "./llms";

const RESUME_FETCH_TIMEOUT_MS = 10_000;

function unavailableResume() {
    return new Response("Résumé is currently unavailable.", { status: 502 });
}

/** Serve a résumé markdown file proxied straight from the CDN. */
export async function serveResumeMarkdown(href: string, filename: string, filenameStar?: string) {
    let resume: Response;
    try {
        resume = await fetch(href, {
            signal: AbortSignal.timeout(RESUME_FETCH_TIMEOUT_MS),
        });
    } catch {
        return unavailableResume();
    }

    if (!resume.ok || !resume.body) {
        return unavailableResume();
    }

    const contentType = resume.headers.get("Content-Type");
    if (!contentType || !/^text\/markdown(?:\s*;|$)/i.test(contentType)) {
        return unavailableResume();
    }

    // The CDN serves `text/markdown` without a charset, which browsers would
    // otherwise decode as Latin-1 and render as mojibake. Pin UTF-8.
    const disposition = filenameStar
        ? `inline; filename=${filename}; filename*=UTF-8''${encodeURIComponent(filenameStar)}`
        : `inline; filename=${filename}`;
    return new Response(resume.body, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": disposition,
            "Cache-Control": MARKDOWN_CACHE_CONTROL,
        },
    });
}
