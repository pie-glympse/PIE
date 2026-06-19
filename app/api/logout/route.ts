import { NextResponse } from 'next/server';

function clearTokenCookie(response: NextResponse) {
  response.cookies.set('token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
  });
}

export async function POST() {
  const response = NextResponse.json({ message: 'Déconnecté avec succès' });
  clearTokenCookie(response);
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  clearTokenCookie(response);
  return response;
}