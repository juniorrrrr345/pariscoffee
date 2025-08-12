/** @type {import('next').NextConfig} */

// Headers de sécurité supplémentaires
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuration optimisée pour Vercel
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Headers spécifiques pour les API
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  },
  
  // Redirections de sécurité
  async redirects() {
    return [
      {
        source: '/admin',
        has: [
          {
            type: 'host',
            value: 'localhost',
          },
        ],
        destination: '/admin',
        permanent: false,
      },
    ]
  },
  
  // Configuration des images (si vous utilisez next/image)
  images: {
    domains: ['localhost', 'vercel.app'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Désactiver les fonctionnalités non nécessaires
  poweredByHeader: false,
  generateEtags: false,
  
  // Compression
  compress: true,
  
  // Optimisations de production
  productionBrowserSourceMaps: false,
  
  // Timeout plus long pour les fonctions serverless (si nécessaire)
  serverRuntimeConfig: {
    maxDuration: 10
  }
}

module.exports = nextConfig