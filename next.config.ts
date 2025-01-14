/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // Matches any hostname
        pathname: '/**',  // Matches any path
      },
      {
        protocol: 'http',
        hostname: '**',  // Optional: Allow HTTP as well
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
