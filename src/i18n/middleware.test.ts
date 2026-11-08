import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handleI18nRouting } from "./middleware";

describe("locale preference during prefetch", () => {
    it.each(["next-router-prefetch", "purpose"])(
        "does not change an existing preference with %s",
        (header) => {
            const response = handleI18nRouting(
                new NextRequest("https://example.com/zh-CN", {
                    headers: {
                        cookie: "NEXT_LOCALE=en",
                        "accept-language": "en",
                        [header]: header === "purpose" ? "prefetch" : "1",
                    },
                })
            );
            expect(response.cookies.get("NEXT_LOCALE")).toBeUndefined();
        }
    );

    it("does not create a preference for a new visitor during prefetch", () => {
        const response = handleI18nRouting(
            new NextRequest("https://example.com/zh-CN", {
                headers: { "accept-language": "en", "next-router-prefetch": "1" },
            })
        );
        expect(response.cookies.get("NEXT_LOCALE")).toBeUndefined();
    });

    it("persists the selected language during navigation", () => {
        const response = handleI18nRouting(
            new NextRequest("https://example.com/zh-CN", {
                headers: { cookie: "NEXT_LOCALE=en", "accept-language": "en" },
            })
        );
        expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("zh-CN");
    });
});
