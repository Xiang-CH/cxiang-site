import info from "@/lib/info";

/** A stable, shareable URL that serves the current résumé PDF directly. */
export async function GET() {
    const resume = await fetch(info.resume.href);

    if (!resume.ok || !resume.body) {
        return new Response("Résumé is currently unavailable.", { status: 502 });
    }

    return new Response(resume.body, {
        headers: {
            "Content-Type": resume.headers.get("Content-Type") ?? "application/pdf",
            "Content-Disposition": "inline; filename=resume_chen_xiang.pdf",
        },
    });
}
