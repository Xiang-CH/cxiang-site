const DEFAULT_CRON_URL = "http://localhost:3000/api/cron/sync-blog-analytics";

function getCronUrl() {
    const value = process.env.BLOG_ANALYTICS_CRON_URL ?? DEFAULT_CRON_URL;
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("BLOG_ANALYTICS_CRON_URL must use http or https.");
    }
    return url;
}

async function main() {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        throw new Error("CRON_SECRET is required.");
    }

    const url = getCronUrl();
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const body = await response.text();

    console.log(`${response.status} ${response.statusText} ${url}`);
    if (body) console.log(body);

    if (!response.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
