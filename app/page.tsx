// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) console.error('Erreur fetch users:', error)
      else setUsers(data)
    }

    fetchUsers()
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-7xl font-bold mb-4 text-red-500">Glyms</h1>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="bg-gray-500 p-2 rounded">
            <p><strong>{user.name}</strong></p>
            <p>{user.email}</p>
          </li>
        ))}
      </ul>
      <h1 className="text-h1 font-urbanist">Mon titre</h1>
      <h2 className="text-h2 font-poppins">Sous-titre</h2>
      <p className="text-bodyLarge">Texte important</p>
      <p className="text-bodySmall ">Texte normal</p>
    </main>
  )
}
