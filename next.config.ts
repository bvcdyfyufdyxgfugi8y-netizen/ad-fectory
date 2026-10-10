import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["@remotion/renderer", "@remotion/bundler"],
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
