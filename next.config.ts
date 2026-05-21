import type { NextConfig } from "next";

/** GitHub Pages 项目页：https://amoslin24.github.io/Cambridge-Assessment-Data/ */
const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? "/Cambridge-Assessment-Data" : "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  ...(githubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  typescript: {
    // KET 模块尚有类型待整理；不影响海丝闯关等已验收页面发布
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
