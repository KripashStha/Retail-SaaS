/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set output to 'standalone' for improved production deployments
  output: 'standalone',
  
  // Configure routes to be dynamic by default
  experimental: {
    // Optimizations that are compatible with dynamic routes
    optimizeCss: {
      // Ensure critters is properly configured
      minify: true,
      inlineFonts: false
    },
    optimizePackageImports: ['@/components/ui'],
  },
  
  // Add proper environment variable handling
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://www.easyinventory.tech'
  }
};
  
export default nextConfig;
