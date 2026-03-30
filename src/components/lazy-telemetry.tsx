"use client";

import dynamic from "next/dynamic";

const SpeedInsights = dynamic(() =>
    import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights)
);
const Analytics = dynamic(() => import("@vercel/analytics/next").then((mod) => mod.Analytics));

export default function LazyTelemetry() {
    return (
        <>
            <SpeedInsights />
            <Analytics />
        </>
    );
}
