import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Keep the Pages export separate so `npm start` can never serve its /vinylbox assets locally.
  ...(isGitHubPages ? { distDir: ".next-pages" } : {}),
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/vinylbox",
        assetPrefix: "/vinylbox",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: isGitHubPages,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.discogs.com",
      },
      {
        protocol: "https",
        hostname: "img.discogs.com",
      },
      {
        protocol: "https",
        hostname: "st.discogs.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
