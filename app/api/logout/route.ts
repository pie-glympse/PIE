import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Déconnecté avec succès' });
  
  // Supprimer le cookie côté serveur
  response.cookies.set('token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true, // Plus sécurisé
  });
  
  return response;
}