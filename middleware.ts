// middleware.ts (à la racine, pas dans app/)
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Routes protégées (nécessitent une authentification)
const protectedRoutes = ['/events', '/dashboard'];

// Routes publiques (pas besoin d'authentification)
const publicRoutes = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lire le token dans les cookies
  const token = request.cookies.get('token')?.value;
  
  // Vérifier si le token est valide
  let isTokenValid = false;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      isTokenValid = true;
    } catch (err) {
      console.error('Token invalide :', err);
      isTokenValid = false;
    }
  }

  // ✅ REDIRECTION AUTOMATIQUE DEPUIS LA RACINE
  if (pathname === '/') {
    if (isTokenValid) {
      // Utilisateur connecté → rediriger vers events
      return NextResponse.redirect(new URL('/events', request.url));
    } else {
      // Utilisateur non connecté → rediriger vers login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ✅ GESTION DES ROUTES PUBLIQUES
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    // Si utilisateur connecté essaie d'accéder au login, rediriger vers events
    if (isTokenValid && pathname === '/login') {
      return NextResponse.redirect(new URL('/events', request.url));
    }
    // Sinon, laisser passer
    return NextResponse.next();
  }

  // ✅ GESTION DES ROUTES PROTÉGÉES
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token || !isTokenValid) {
      // Pas de token ou token invalide → redirect vers login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Token valide → accès autorisé
    return NextResponse.next();
  }

  // Pour toutes les autres routes, laisser passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};