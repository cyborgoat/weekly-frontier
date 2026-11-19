/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/weekly-frontier",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
