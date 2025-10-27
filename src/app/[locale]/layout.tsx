import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import "aos/dist/aos.css";

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

    return (
        <NextIntlClientProvider>
            <div lang="{locale}" className="ring-0 border-0">
                {children}
            </div>
        </NextIntlClientProvider>
    );
}
