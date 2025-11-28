"use client";

import posthog from "posthog-js";

// Initialize PostHog only in the browser
if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
        api_host: "/relay-5woc",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
    });
}

export {};
