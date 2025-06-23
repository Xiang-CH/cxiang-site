import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    domains: ["avatars.githubusercontent.com", "images.unsplash.com", "www.notion.so", "prod-files-secure.s3.us-west-2.amazonaws.com"],
  },
  experimental: {
    useCache: true,
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
