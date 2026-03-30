import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Press_Start_2P } from "next/font/google";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return {
        alternates: {
            canonical: `${SITE_URL}/${locale}`,
            languages: {
                en: `${SITE_URL}/en`,
                "zh-CN": `${SITE_URL}/zh-CN`,
                "x-default": `${SITE_URL}/${routing.defaultLocale}`,
            },
        },
    };
}

const pressStart = Press_Start_2P({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-press-start-2p",
});

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Ensure that the incoming `locale` is valid
    const { locale } = (await params) as { locale: "en" | "zh-CN" | "zh-HK" };
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);

    return (
        <NextIntlClientProvider>
            <div lang={locale} className={"ring-0 border-0 " + pressStart.variable}>
                {children}
            </div>
        </NextIntlClientProvider>
    );
}
