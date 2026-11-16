import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    commitTag: process.env.COMMIT_TAG || 'local',
  },
  // Allow opening the dev UI via 127.0.0.1 while Next binds to localhost
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { hostname: 'gravatar.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'artworks.thetvdb.com' },
      { hostname: 'plex.tv' },
      { hostname: 'archive.org' },
      { hostname: 'r2.theaudiodb.com' },
      { hostname: 'covers.openlibrary.org' },
    ],
  },
  transpilePackages: ['country-flag-icons'],
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  experimental: {
    scrollRestoration: true,
    largePageDataBytes: 512 * 1000,
  },
};

export default nextConfig;
