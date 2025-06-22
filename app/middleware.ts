// app/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // même que pour login

// Routes protégées
const protectedRoutes = ['/events', '/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifie si la route est protégée
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) return NextResponse.next();

  // Lire le token dans les cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Pas de token → redirect
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next(); // Token valide → accès autorisé
  } catch (err) {
    console.error('Token invalide :', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/events/:path*', '/dashboard/:path*'], // protège tout sous /events et /dashboard
};