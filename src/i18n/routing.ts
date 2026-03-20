import { defineRouting } from "next-intl/routing";

export const locales = {
    en: "English",
    "zh-CN": "中文",
    // "zh-HK": "繁體中文",
};

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: Object.keys(locales),

    // Used when no locale matches
    defaultLocale: "en",
});
