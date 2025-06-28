// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MainButton from '@/components/ui/MainButton'
import LoginForm from '@/components/forms/LoginForm'
import Modal from '@/components/layout/Modal'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(true) // État pour contrôler l'ouverture de la modal
  const [currentStep, setCurrentStep] = useState(1) // État pour le step actuel

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) console.error('Erreur fetch users:', error)
      else setUsers(data)
    }

    fetchUsers()
  }, [])

  const stepContents = [
    {
      title: "Bienvenue",
      text: "Commençons votre parcours d'inscription",
      buttonText: "Commencer"
    },
    {
      title: "Vos informations",
      text: "Veuillez renseigner vos données personnelles"
    },
    {
      title: "Confirmation",
      text: "Vérifiez vos informations avant validation"
    }
  ]

  // Handler pour fermer la modal
  const handleClose = () => {
    setIsModalOpen(false)
  }

  // Handler pour passer au step suivant ou fermer à la fin
  const handleNext = () => {
    if (currentStep < stepContents.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Dernier step - fermer la modal ou faire une action finale
      setIsModalOpen(false)
      console.log('Processus terminé !')
    }
  }

  // Handler pour ouvrir la modal (optionnel)
  const openModal = () => {
    setIsModalOpen(true)
    setCurrentStep(1) // Reset au premier step
  }

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
      <p className="text-bodySmall">Texte normal</p>

      {/* Bouton pour rouvrir la modal (optionnel) */}
      {!isModalOpen && (
        <MainButton 
          text="Ouvrir Modal" 
          onClick={openModal}
          color="bg-blue-500 text-white"
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        onButtonClick={handleNext}
        showSteppers={true}
        currentStep={currentStep}
        totalSteps={stepContents.length}
        stepContents={stepContents}
        lastStepButtonText="Valider"
      />
    </main>
  )
}