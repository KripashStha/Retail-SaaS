/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure routes that need to be dynamic
  // This ensures pages using server features like cookies are properly handled
  output: 'standalone',
  
  // Updated configuration based on Next.js 15.1.1 recommendations
  serverExternalPackages: []
};
  
export default nextConfig;
