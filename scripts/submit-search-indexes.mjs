#!/usr/bin/env node

const SITE_URL = (process.env.SITE_URL || "https://cxiang.site").replace(/\/$/, "");
const RUN_REASON = process.env.RUN_REASON || "push";
const FORCE_SITEMAP_CHECK = process.env.FORCE_SITEMAP_CHECK === "1";
const changedFiles = (process.env.CHANGED_FILES || "")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

function absoluteUrl(pathname) {
    return new URL(pathname, SITE_URL).toString();
}

function isContentChange(file) {
    return (
        file.startsWith("locales/") ||
        file.startsWith("src/app/blog/") ||
        file.startsWith("src/app/project/") ||
        file.startsWith("src/app/[locale]/") ||
        file === "src/lib/notion.ts" ||
        file === "src/app/sitemap.ts" ||
        file === "src/app/layout.tsx"
    );
}

function urlsFromChangedFiles(files) {
    const urls = new Set([absoluteUrl("/"), absoluteUrl("/zh-CN")]);

    for (const file of files) {
        if (file.startsWith("src/app/blog/") || file === "src/lib/notion.ts") {
            urls.add(absoluteUrl("/blog"));
        }
        if (file.startsWith("src/app/project/")) {
            urls.add(absoluteUrl("/project"));
        }
    }

    // Always include sitemap so crawlers can discover newly changed pages.
    urls.add(absoluteUrl("/sitemap.xml"));
    return [...urls];
}

function decodeXmlEntities(text) {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

async function getBlogUrlsFromSitemap() {
    const sitemapUrl = absoluteUrl("/sitemap.xml");
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
        throw new Error(`Failed to fetch sitemap (${res.status}) from ${sitemapUrl}`);
    }

    const xml = await res.text();
    const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
    const urls = locMatches
        .map((m) => decodeXmlEntities((m[1] || "").trim()))
        .filter(Boolean)
        .filter((url) => {
            try {
                const parsed = new URL(url);
                return parsed.origin === new URL(SITE_URL).origin && parsed.pathname.startsWith("/blog/");
            } catch {
                return false;
            }
        });

    return [...new Set(urls)];
}

async function submitIndexNow(urls) {
    const key = process.env.INDEXNOW_KEY;
    if (!key) {
        console.log("INDEXNOW_KEY is not set; skipping IndexNow submission.");
        return;
    }

    const keyLocation =
        process.env.INDEXNOW_KEY_LOCATION || absoluteUrl(`/${encodeURIComponent(key)}.txt`);
    const host = new URL(SITE_URL).host;

    const payload = {
        host,
        key,
        keyLocation,
        urlList: urls,
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`IndexNow failed (${res.status}): ${body}`);
    }

    console.log(`IndexNow submitted ${urls.length} URL(s).`);
}

async function submitBaidu(urls) {
    const token = process.env.BAIDU_TOKEN;
    const site = process.env.BAIDU_SITE || SITE_URL;

    if (!token) {
        console.log("BAIDU_TOKEN is not set; skipping Baidu submission.");
        return;
    }

    const api = `https://data.zz.baidu.com/urls?site=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`;

    const res = await fetch(api, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: urls.join("\n"),
    });

    const body = await res.text();
    if (!res.ok) {
        throw new Error(`Baidu submission failed (${res.status}): ${body}`);
    }

    console.log(`Baidu submission response: ${body}`);
}

async function main() {
    if (changedFiles.length === 0) {
        console.log("No changed files passed in; skipping.");
        return;
    }

    const hasContentChanges = changedFiles.some(isContentChange);
    if (!hasContentChanges && !FORCE_SITEMAP_CHECK) {
        console.log(
            "No content-related changes detected and sitemap check not forced; skipping submissions."
        );
        return;
    }

    const urls = new Set(urlsFromChangedFiles(changedFiles));
    const shouldCheckSitemap = FORCE_SITEMAP_CHECK || hasContentChanges;
    if (shouldCheckSitemap) {
        try {
            const blogUrls = await getBlogUrlsFromSitemap();
            for (const url of blogUrls) urls.add(url);
            console.log(`Sitemap blog URL check found ${blogUrls.length} URL(s).`);
        } catch (error) {
            console.warn(`Sitemap check failed (${RUN_REASON}):`, error.message);
        }
    }

    const finalUrls = [...urls];
    console.log(`Submitting ${finalUrls.length} URL(s):`);
    for (const url of finalUrls) console.log(`- ${url}`);

    await submitIndexNow(finalUrls);
    await submitBaidu(finalUrls);

    // Google has no general URL submission API for normal pages.
    console.log(
        "Google: no general URL submission API for standard pages. Keep sitemap submitted in Search Console."
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
