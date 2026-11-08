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

describe("prefetching English from the Chinese home page", () => {
    it("resolves to English without changing the saved Chinese preference", () => {
        let url = "https://example.com/en";
        let response: ReturnType<typeof handleI18nRouting> | undefined;
        for (let hop = 0; hop < 5; hop++) {
            response = handleI18nRouting(
                new NextRequest(url, {
                    headers: {
                        cookie: "NEXT_LOCALE=zh-CN",
                        "accept-language": "zh-CN",
                        "next-router-prefetch": "1",
                    },
                })
            );
            expect(response.cookies.get("NEXT_LOCALE")).toBeUndefined();
            const redirect = response.headers.get("location");
            if (!redirect) break;
            url = redirect;
        }
        expect(response?.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
        expect(url).toBe("https://example.com/en");
    });
});

it("keeps the canonical English redirect and preference update for real navigation", () => {
    const response = handleI18nRouting(
        new NextRequest("https://example.com/en", {
            headers: { cookie: "NEXT_LOCALE=zh-CN", "accept-language": "zh-CN" },
        })
    );
    expect(response.headers.get("location")).toBe("https://example.com/");
    expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("en");
});
