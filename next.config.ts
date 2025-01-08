import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'preview.redd.it',
        pathname: '/**',
      },
      // Add other domains as needed
    ],
  },
};

export default nextConfig;
