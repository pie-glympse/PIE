import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Importer dynamiquement pour capturer les erreurs d'initialisation
    let supabaseServer;
    try {
      const { supabaseServer: server } = await import('@/lib/supabaseServer');
      supabaseServer = server;
    } catch (importError) {
      console.error('Erreur import Supabase:', importError);
      return NextResponse.json(
        { 
          error: 'Configuration Supabase manquante',
          details: importError instanceof Error ? importError.message : 'Vérifiez que SUPABASE_SERVICE_ROLE_KEY est définie dans .env.local'
        },
        { status: 500 }
      );
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar' ou 'banner'
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux (5MB max)' }, { status: 400 });
    }

    // Déterminer le bucket selon le type
    const bucket = type === 'banner' ? 'banners' : 'avatars';
    
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${extension}`;
    // Ne pas inclure le nom du bucket dans le chemin car Supabase l'ajoute automatiquement
    const filePath = filename;

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // Ne pas écraser si le fichier existe déjà
      });

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload vers Supabase', details: uploadError.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Impossible de générer l\'URL publique' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: filePath 
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'upload',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}