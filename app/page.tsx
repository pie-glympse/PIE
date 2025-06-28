// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MainButton from '@/components/ui/MainButton'
import LoginForm from '@/components/forms/LoginForm'
import Modal from '@/components/layout/Modal'
import CategoryBtn from '@/components/ui/CategoryBtn'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(true) // État pour contrôler l'ouverture de la modal
  const [currentStep, setCurrentStep] = useState(1) // État pour le step actuel
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

     const categories = [
        'Technologie',
        'Design',
        'Marketing',
        'Finance',
        'Ressources Humaines',
        'Ventes',
        'Développement Personnel',
        'Santé et Bien-être',
        'Éducation',
        'Environnement',
        'Art et Culture',
        'Voyages',
        'Sports et Loisirs',
        'Entrepreneuriat',
        'Innovation',
        'Leadership',
        'Communication',
        'Gestion de Projet',
        'Stratégie',
        'Analyse de Données',
        'Intelligence Artificielle',
        'Blockchain',
        'Cybersécurité',
        'Développement Durable',
        'Économie Circulaire',
    ];

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category === selectedCategory ? null : category);
    };


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
  <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sélectionnez une catégorie :</h3>
            <ul className="flex flex-wrap gap-3">
                {categories.map((category) => (
                    <CategoryBtn
                        key={category}
                        text={category}
                        isSelected={selectedCategory === category}
                        onClick={() => handleCategoryClick(category)}
                    />
                ))}
            </ul>
            
            {selectedCategory && (
                <p className="mt-4 text-sm text-gray-600">
                    Catégorie sélectionnée : <strong>{selectedCategory}</strong>
                </p>
            )}
        </div>
    </main>
  )
}