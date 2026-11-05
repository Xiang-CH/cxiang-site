import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            // Tests import modules that use the `@/` alias internally, so the
            // test runner needs the same mapping as tsconfig.json.
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            // The real marker package throws outside a server component; tests
            // need server-side modules to be importable.
            "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
        },
    },
});
