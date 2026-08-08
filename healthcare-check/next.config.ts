import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist resolves its worker file relative to its own package
  // location at runtime — keep it out of the webpack bundle so that
  // resolution keeps working against the real node_modules on disk.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
