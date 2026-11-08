import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // next-intl imports Next.js extensionless modules intended for a bundler.
        server: { deps: { inline: ["next-intl"] } },
    },
});
