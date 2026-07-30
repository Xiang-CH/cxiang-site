import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { getBlogSlugFromPath } from "../src/lib/blog-stats-utils";

const METRIC = "vercel.analytics_pageview.count";
const ROLLUP_COLUMN = "vercel_analytics_pageview_count_sum";
const MAX_GROUP_LIMIT = 500;

type Options = {
    apply: boolean;
    input?: string;
    limit: number;
    project?: string;
    scope?: string;
    since?: string;
    until?: string;
};

type ViewTotal = {
    slug: string;
    views: number;
};

/**
 * Prints an optional error and usage instructions before exiting with status code 1.
 *
 * @param message - An optional error message to display before the usage instructions
 */
function usage(message?: string): never {
    if (message) console.error(`Error: ${message}\n`);
    console.error(`Usage:
  bun run db:import:vercel-views -- --project <vercel-project> --since <date-or-duration> [--until <date>] [--scope <team>] [--apply]
  bun run db:import:vercel-views -- --input <vercel-metrics.json> [--apply]

The default is a dry run. --apply writes the imported values to historical_view_count.
--input accepts JSON produced by: vercel metrics ${METRIC} --format json ...`);
    process.exit(1);
}

/**
 * Parses command-line arguments into validated import options.
 *
 * @param args - Command-line arguments to parse
 * @returns The configured import options
 */
export function parseOptions(args: string[]): Options {
    const options: Options = { apply: false, limit: MAX_GROUP_LIMIT };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--apply") {
            options.apply = true;
            continue;
        }

        if (
            arg === "--project" ||
            arg === "--since" ||
            arg === "--until" ||
            arg === "--scope" ||
            arg === "--input" ||
            arg === "--limit"
        ) {
            const value = args[index + 1];
            if (!value || value.startsWith("--")) usage(`Missing a value for ${arg}.`);
            index += 1;

            if (arg === "--project") options.project = value;
            if (arg === "--since") options.since = value;
            if (arg === "--until") options.until = value;
            if (arg === "--scope") options.scope = value;
            if (arg === "--input") options.input = value;
            if (arg === "--limit") {
                const limit = Number(value);
                if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_GROUP_LIMIT) {
                    usage(`--limit must be a whole number from 1 to ${MAX_GROUP_LIMIT}.`);
                }
                options.limit = limit;
            }
            continue;
        }

        usage(`Unknown option ${arg}.`);
    }

    if (!options.input && (!options.project || !options.since)) {
        usage("--project and --since are required unless --input is supplied.");
    }

    return options;
}

/**
 * Builds an error message from Vercel CLI output and its exit code.
 *
 * @param stdout - Standard output produced by the CLI
 * @param stderr - Standard error produced by the CLI
 * @param exitCode - The CLI process exit code
 * @returns Trimmed CLI output, preferring standard output over standard error, or a fallback message containing the exit code
 */
export function getVercelCliError(stdout: string, stderr: string, exitCode: number | null) {
    return stdout.trim() || stderr.trim() || `vercel metrics exited with code ${exitCode}.`;
}

/**
 * Extracts a blog post slug from a route path.
 *
 * @param value - The value to interpret as a blog route path
 * @returns The blog post slug, or `null` when the value is not a canonical blog path
 */
export function slugFromBlogPath(value: unknown): string | null {
    return getBlogSlugFromPath(value);
}

/**
 * Extracts and aggregates canonical blog post view totals from Vercel metrics data.
 *
 * @param payload - Vercel metrics JSON containing a `data` array of metric rows
 * @returns View totals sorted by blog post slug
 */
export function extractViewTotals(payload: unknown): ViewTotal[] {
    if (!payload || typeof payload !== "object") {
        throw new Error("Vercel metrics did not return a JSON object.");
    }

    const data = (payload as { data?: unknown }).data;
    if (!Array.isArray(data)) {
        throw new Error("Vercel metrics JSON has no data array.");
    }

    const totals = new Map<string, number>();
    for (const row of data) {
        if (!row || typeof row !== "object") continue;
        const record = row as Record<string, unknown>;
        const slug = slugFromBlogPath(record.request_path);
        const views = Number(record[ROLLUP_COLUMN]);
        if (!slug || !Number.isSafeInteger(views) || views < 0) continue;

        totals.set(slug, (totals.get(slug) ?? 0) + views);
    }

    return [...totals]
        .map(([slug, views]) => ({ slug, views }))
        .sort((left, right) => left.slug.localeCompare(right.slug));
}

/**
 * Fetches Vercel pageview metrics for blog routes within the configured range.
 *
 * @param options - CLI options specifying the Vercel project, time range, filters, and result limit
 * @returns The parsed JSON response from the Vercel metrics command
 */
async function runVercelMetrics(options: Options): Promise<unknown> {
    const args = [
        "vercel@latest",
        "metrics",
        METRIC,
        "--prod",
        "--project",
        options.project!,
        "--since",
        options.since!,
        "--granularity",
        "1d",
        "--filter",
        "startswith(request_path, '/blog/')",
        "--group-by",
        "request_path",
        "--limit",
        String(options.limit),
        "--format",
        "json",
    ];

    if (options.until) args.push("--until", options.until);
    if (options.scope) args.push("--scope", options.scope);

    const output = await new Promise<string>((resolve, reject) => {
        const child = spawn("bunx", args, { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk: string) => {
            stdout += chunk;
        });
        child.stderr.on("data", (chunk: string) => {
            stderr += chunk;
        });
        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(getVercelCliError(stdout, stderr, code)));
        });
    });

    return JSON.parse(output);
}

/**
 * Loads metrics from an input file or the Vercel metrics CLI.
 *
 * @param options - Configuration specifying the input source and Vercel query options
 * @returns The parsed metrics payload
 */
async function loadMetrics(options: Options): Promise<unknown> {
    if (options.input) return JSON.parse(await readFile(options.input, "utf8"));
    return runVercelMetrics(options);
}

/**
 * Persists historical view totals for blog posts.
 *
 * @param totals - The per-slug view totals to insert or update.
 */
async function writeHistoricalViews(totals: ViewTotal[]) {
    const connectionString = process.env.DATABASE_URL_UNPOOLED;
    if (!connectionString) {
        throw new Error("DATABASE_URL_UNPOOLED is required to apply the historical import.");
    }

    const pool = new Pool({ connectionString, max: 1 });
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const { slug, views } of totals) {
            await client.query(
                `INSERT INTO blog_post_stats (slug, historical_view_count)
                 VALUES ($1, $2)
                 ON CONFLICT (slug) DO UPDATE
                 SET historical_view_count = EXCLUDED.historical_view_count,
                     updated_at = NOW()`,
                [slug, views]
            );
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * Imports historical blog post view totals from Vercel metrics.
 *
 * @throws If no canonical blog pageviews are found or the import fails.
 */
async function main() {
    const options = parseOptions(process.argv.slice(2));
    const totals = extractViewTotals(await loadMetrics(options));

    if (totals.length === 0) {
        throw new Error("No canonical /blog/<slug> pageviews were found in the selected range.");
    }

    console.table(totals);
    console.log(
        `\n${totals.length} blog posts; ${totals.reduce((sum, item) => sum + item.views, 0)} historical pageviews.`
    );

    if (!options.apply) {
        console.log(
            "Dry run only. Re-run with --apply to replace the historical baseline for these slugs."
        );
        return;
    }

    await writeHistoricalViews(totals);
    console.log("Historical view baseline imported successfully.");
}

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
}
