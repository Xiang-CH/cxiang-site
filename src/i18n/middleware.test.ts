import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handleI18nRouting } from "./middleware";

describe("explicit language selection", () => {
    it.each([
        { target: "en", previous: "zh-CN" },
        { target: "zh-CN", previous: "en" },
    ])("resolves $target from $previous through canonical redirects", ({ target, previous }) => {
        let url = `https://example.com/${target}`;
        let cookie = `NEXT_LOCALE=${previous}`;
        let response: ReturnType<typeof handleI18nRouting> | undefined;
        for (let hop = 0; hop < 5; hop++) {
            response = handleI18nRouting(
                new NextRequest(url, {
                    headers: { cookie, "accept-language": previous },
                })
            );
            const preference = response.cookies.get("NEXT_LOCALE");
            if (preference) cookie = `NEXT_LOCALE=${preference.value}`;
            const redirect = response.headers.get("location");
            if (!redirect) break;
            url = redirect;
        }
        expect(response?.headers.get("x-middleware-request-x-next-intl-locale")).toBe(target);
        expect(cookie).toBe(`NEXT_LOCALE=${target}`);
    });
});

it("serves the explicit English target without redirecting to a cookie-dependent URL", () => {
    const response = handleI18nRouting(
        new NextRequest("https://example.com/en", {
            headers: { cookie: "NEXT_LOCALE=zh-CN", "accept-language": "zh-CN" },
        })
    );
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
});

it("keeps the existing unprefixed English homepage available", () => {
    const response = handleI18nRouting(
        new NextRequest("https://example.com/", { headers: { cookie: "NEXT_LOCALE=en" } })
    );
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
});
