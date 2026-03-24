import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Noto_Sans, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "@/app/globals.css";
import MenuBar from "@/components/menu-bar";
import { Toaster } from "@/components/ui/sonner";
import { WebSite, WithContext } from "schema-dts";
import Viewer from "@/components/viewer";

const notoSans = Noto_Sans({
    variable: "--font-noto-sans",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Chen Xiang 陈想",
    description: "Chen Xiang's personal website",
};

const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chen Xiang",
    alternateName: ["CXiang", "陈想"],
    url: "https://cxiang.site",
    description: "Chen Xiang's personal website",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-title" content="CXiang" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd),
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
                    <Suspense fallback={<></>}>
                        <Viewer />
                    </Suspense>
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
                    <SpeedInsights />
                    <Analytics />
                </ThemeProvider>
            </body>
        </html>
    );
}
