'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // ✅ Redirection automatique vers /events
        router.push('/events');
      } else {
        const error = await response.json();
        alert(error?.error || 'Erreur lors de l’inscription');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau ou serveur');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <input name="name" type="text" placeholder="Nom" onChange={handleChange} required className="w-full border p-2" />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full border p-2" />
      <input name="password" type="password" placeholder="Mot de passe" onChange={handleChange} required className="w-full border p-2" />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">S’inscrire</button>
    </form>
  );
}
