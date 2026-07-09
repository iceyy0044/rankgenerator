/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // @napi-rs/canvas ships a native .node binding; keep it out of the
  // server bundle so Node resolves it directly instead of the bundler
  // trying (and failing) to statically resolve the optional platform package.
  serverExternalPackages: ["@napi-rs/canvas"],
}

export default nextConfig
