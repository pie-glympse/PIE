// app/api/mock-user/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase.from('users').insert([
    {
      id: 1,
      name: 'Alice Test',
      email: 'alice@test.com',
      password: 'test123', // ⚠️ En prod, jamais stocker en clair
      role: 'STANDARD',
      photo_url: 'https://i.pravatar.cc/150?img=4',
    }
  ])

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
