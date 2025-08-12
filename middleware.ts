import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Configuration du rate limiting (stockage en mémoire simple)
const rateLimitMap = new Map();

// Fonction pour nettoyer les anciennes entrées du rate limit
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.firstRequest > 900000) { // 15 minutes
      rateLimitMap.delete(key);
    }
  }
}

// Fonction de rate limiting
function rateLimit(ip: string, pathname: string): boolean {
  cleanupRateLimit();
  
  const key = `${ip}-${pathname}`;
  const now = Date.now();
  const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 min
  
  const current = rateLimitMap.get(key);
  
  if (!current) {
    rateLimitMap.set(key, { count: 1, firstRequest: now });
    return true;
  }
  
  if (now - current.firstRequest > windowMs) {
    rateLimitMap.set(key, { count: 1, firstRequest: now });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  
  // Récupérer l'IP du client
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // ===================================
  // 🛡️ HEADERS DE SÉCURITÉ (pour toutes les routes)
  // ===================================
  const response = NextResponse.next();
  
  // Headers de sécurité essentiels
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Supprimer les headers révélateurs
  response.headers.delete('x-powered-by');
  response.headers.delete('server');
  
  // Content Security Policy basique (ajustez selon vos besoins)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // ===================================
  // 🚦 RATE LIMITING (pour les routes API)
  // ===================================
  if (pathname.startsWith('/api/')) {
    if (!rateLimit(ip, pathname)) {
      return new NextResponse('Trop de requêtes. Veuillez réessayer plus tard.', {
        status: 429,
        headers: {
          'Retry-After': '900',
          'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
          'X-RateLimit-Remaining': '0',
        }
      });
    }
  }
  
  // ===================================
  // 🔒 PROTECTION /ADMIN
  // ===================================
  if (pathname.startsWith('/admin')) {
    // Vérifier le token d'authentification
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('admin-token');
    
    // Méthode 1: Bearer Token dans les headers
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token === process.env.ADMIN_TOKEN) {
        return response;
      }
    }
    
    // Méthode 2: Cookie d'authentification
    if (cookieToken && cookieToken.value === process.env.ADMIN_TOKEN) {
      return response;
    }
    
    // Méthode 3: Basic Auth (pour navigateur)
    const basicAuth = request.headers.get('authorization');
    if (basicAuth?.startsWith('Basic ')) {
      const auth = basicAuth.split(' ')[1];
      const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');
      
      if (user === process.env.SITE_USERNAME && pwd === process.env.ADMIN_PASSWORD) {
        // Créer un cookie de session
        response.cookies.set('admin-token', process.env.ADMIN_TOKEN!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 heures
          path: '/'
        });
        return response;
      }
    }
    
    // Si aucune authentification valide, demander l'authentification
    return new NextResponse('Authentification requise', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Zone Admin Sécurisée"'
      }
    });
  }
  
  // ===================================
  // 🌐 PROTECTION GLOBALE DU SITE (optionnelle)
  // ===================================
  if (process.env.SITE_PROTECTION_ENABLED === 'true' && !pathname.startsWith('/api/')) {
    const basicAuth = request.headers.get('authorization');
    
    if (basicAuth?.startsWith('Basic ')) {
      const auth = basicAuth.split(' ')[1];
      const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');
      
      if (user === process.env.SITE_USERNAME && pwd === process.env.SITE_PASSWORD) {
        return response;
      }
    }
    
    return new NextResponse('Site en maintenance', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Site Protégé"'
      }
    });
  }
  
  // ===================================
  // 📦 ROUTES API SPÉCIFIQUES (garde l'ancien comportement)
  // ===================================
  if (pathname.startsWith('/api/products') || pathname.startsWith('/api/upload')) {
    response.headers.set('x-middleware-cache', 'no-cache');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};