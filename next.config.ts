import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
    cacheComponents: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "cdn.cxiang.site",
            },
            {
                protocol: "https",
                hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
            },
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net",
                pathname: "/gh/devicons/devicon@latest/icons/**",
            },
        ],
        qualities: [40, 50, 70, 75],
    },
    async rewrites() {
        return [
            {
                source: "/relay-5woc/static/:path*",
                destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/static/:path*`,
            },
            {
                source: "/relay-5woc/:path*",
                destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/:path*`,
            },
            {
                source: "/relay-5woc/flags",
                destination: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/flags`,
            },
            {
                source: "/:locale(en|zh-CN)",
                destination: "/:locale/llms.txt",
                has: [
                    {
                        type: "header",
                        key: "accept",
                        value: "(.*)text/plain(.*)",
                    },
                ],
            },
        ];
    },
    skipTrailingSlashRedirect: true,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
