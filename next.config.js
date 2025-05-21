/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.fineartamerica.com'],
  },
}

module.exports = nextConfig 