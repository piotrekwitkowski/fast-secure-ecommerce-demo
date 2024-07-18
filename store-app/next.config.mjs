/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: false,
  images: {
    loader: 'custom',
    loaderFile: './ImageCustomLoader.js',
    deviceSizes: [320, 640, 1080, 2048],
  },
};

export default nextConfig;
