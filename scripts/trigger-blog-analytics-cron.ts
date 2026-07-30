const DEFAULT_CRON_URL = "http://localhost:3000/api/cron/sync-blog-analytics";
const CRON_REQUEST_TIMEOUT_MS = 20_000;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function getCronUrl() {
    const value = process.env.BLOG_ANALYTICS_CRON_URL ?? DEFAULT_CRON_URL;
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("BLOG_ANALYTICS_CRON_URL must use http or https.");
    }
    if (url.protocol === "http:" && !LOOPBACK_HOSTS.has(url.hostname)) {
        throw new Error("BLOG_ANALYTICS_CRON_URL must use https outside of loopback hosts.");
    }
    return url;
}

async function main() {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        throw new Error("CRON_SECRET is required.");
    }

    const url = getCronUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CRON_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${cronSecret}` },
            signal: controller.signal,
        });
        const body = await response.text();

        console.log(`${response.status} ${response.statusText} ${url}`);
        if (body) console.log(body);

        if (!response.ok) process.exitCode = 1;
    } finally {
        clearTimeout(timeout);
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
