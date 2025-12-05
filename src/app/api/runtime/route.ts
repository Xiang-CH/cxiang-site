export async function GET() {
    if (process.versions.bun) {
        return new Response("Running with Bun. Version: " + process.versions.bun);
    } else if (process.versions.node) {
        return new Response("Running with Node.js. Version: " + process.versions.node);
    } else {
        return new Response("Unknown runtime environment.");
    }
}
