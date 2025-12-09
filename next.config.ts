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
        qualities: [40, 70, 75],
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
        ];
    },
    skipTrailingSlashRedirect: true,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
