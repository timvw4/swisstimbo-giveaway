/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: true,
  },
  experimental: {
    appDir: false,
  },
  basePath: '',
  output: 'standalone',
}

module.exports = nextConfig 