import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Noto_Sans, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import MenuBar from "@/components/menu-bar";
import { Toaster } from "@/components/ui/sonner";
import { Person, WebSite, WithContext } from "schema-dts";
import ConsoleArtLogger from "@/components/console-art-logger";
import LazyViewer from "@/components/lazy-viewer";
import LazyTelemetry from "@/components/lazy-telemetry";

const notoSans = Noto_Sans({
    variable: "--font-noto-sans",
    subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin", "latin-ext"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "Chen Xiang 陈想",
        template: "%s | Chen Xiang",
    },
    description: "Personal website and portfolio of Chen Xiang, showcasing projects and experience",
    authors: [{ name: "Chen Xiang", url: SITE_URL }],
    creator: "Chen Xiang",
    publisher: "Chen Xiang",
    alternates: {
        languages: {
            en: `${SITE_URL}/en`,
            "zh-CN": `${SITE_URL}/zh-CN`,
            "x-default": `${SITE_URL}/en`,
        },
    },
    openGraph: {
        title: "Chen Xiang 陈想",
        siteName: "Chen Xiang",
        url: SITE_URL,
        images: [{ url: "https://cdn.cxiang.site/default-og-image.jpg" }],
        description: "My personal portfolio website",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Chen Xiang 陈想",
        description: "My personal portfolio website",
        images: [{ url: "https://cdn.cxiang.site/default-og-image.jpg" }],
    },
};

const websiteJsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chen Xiang",
    alternateName: ["CXiang", "陈想"],
    url: SITE_URL,
    description: "Chen Xiang's personal website",
};

const personJsonLd: WithContext<Person> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Chen Xiang",
    alternateName: ["CXiang", "陈想"],
    url: SITE_URL,
    image: "https://avatars.githubusercontent.com/u/63144890?s=96&v=4",
    jobTitle: "Full-Stack Software Developer",
    sameAs: [
        "https://github.com/Xiang-CH",
        "https://www.linkedin.com/in/xiang-chen-62389526a/",
        "https://www.instagram.com/chen.xiiang/",
    ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="baidu-site-verification" content="codeva-mxRqrYyNJ1" />
                <meta name="apple-mobile-web-app-title" content="CXiang" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(websiteJsonLd),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(personJsonLd),
                    }}
                />
            </head>
            <body
                className={`${notoSans.variable} ${jetbrainsMono.variable} antialiased min-h-full pb-[env(safe-area-inset-bottom)] flex flex-col`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <LazyViewer />
                    <ConsoleArtLogger />
                    <MenuBar />
                    {/* <div className="h-14" /> */}
                    <div className="px-4">
                        <div className="min-h-[calc(100vh-var(--spacing)*34)] max-w-244 mx-auto">
                            {children}
                        </div>
                    </div>
                    <footer className="my-6 flex items-center justify-center px-8 pb-[env(safe-area-inset-bottom)]">
                        <div className="text-[0.65rem] text-muted-foreground w-full flex flex-wrap items-center justify-center gap-3">
                            <span>{"©"} 2026 Chen Xiang</span>
                            <span>|</span>
                            <span>CXIANG-OS - session active</span>
                        </div>
                    </footer>
                    <Toaster />
                    <LazyTelemetry />
                </ThemeProvider>
            </body>
        </html>
    );
}
