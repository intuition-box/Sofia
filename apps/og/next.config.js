/** @type {import('next').NextConfig} */
const nextConfig = {
  // No next/image here: turning the optimizer off removes /_next/image,
  // the route behind Next's image-optimizer advisories.
  images: { unoptimized: true },
}

module.exports = nextConfig
