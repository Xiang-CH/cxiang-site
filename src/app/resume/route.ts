import info from "@/lib/info";

const RESUME_FETCH_TIMEOUT_MS = 10_000;

function unavailableResume() {
    return new Response("Résumé is currently unavailable.", { status: 502 });
}

/** A stable, shareable URL that serves the current résumé PDF directly. */
export async function GET() {
    let resume: Response;
    try {
        resume = await fetch(info.resume.href, {
            signal: AbortSignal.timeout(RESUME_FETCH_TIMEOUT_MS),
        });
    } catch {
        return unavailableResume();
    }

    if (!resume.ok || !resume.body) {
        return unavailableResume();
    }

    const contentType = resume.headers.get("Content-Type");
    if (!contentType || !/^application\/pdf(?:\s*;|$)/i.test(contentType)) {
        return unavailableResume();
    }

    return new Response(resume.body, {
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": "inline; filename=resume_chen_xiang.pdf",
        },
    });
}
