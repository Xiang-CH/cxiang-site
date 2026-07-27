import { NextResponse } from "next/server";
import info from "@/lib/info";

/** A stable, shareable URL for the current résumé PDF. */
export function GET() {
    return NextResponse.redirect(info.resume.href);
}
