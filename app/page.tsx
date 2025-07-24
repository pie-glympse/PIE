// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import MainButton from '@/components/ui/MainButton'
import Modal from '@/components/layout/Modal'
import CategoryBtn from '@/components/ui/CategoryBtn'

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(true) // État pour contrôler l'ouverture de la modal
  const [currentStep, setCurrentStep] = useState(1) // État pour le step actuel
  // CHANGEMENT : Array au lieu de string | null
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

    // CHANGEMENT : Logique de toggle pour sélection multiple
    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev => {
            // Si la catégorie est déjà sélectionnée, la retirer
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            }
            // Sinon, l'ajouter
            return [...prev, category];
        });
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
      buttonText: "Commencer",
      image: "/images/mascotte/base.png",
      imagePosition: 'right' as const
    },
    {
      title: "Vos informations",
      text: "Veuillez renseigner vos données personnelles",
      image: "/images/mascotte/base.png",
      imagePosition: 'right' as const
    },
    {
      title: "Confirmation",
      text: "Vérifiez vos informations avant validation",
      image: "/images/mascotte/joy.png",
      imagePosition: 'center' as const
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
            <p><strong>{user.firstName} {user.lastName}</strong></p>
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
        <h3 className="text-lg font-semibold mb-4">Sélectionnez une ou plusieurs catégories :</h3>
        <ul className="flex flex-wrap gap-3">
            {categories.map((category) => (
                <CategoryBtn
                    key={category}
                    text={category}
                    // CHANGEMENT : Vérifier si la catégorie est dans l'array
                    isSelected={selectedCategories.includes(category)}
                    onClick={() => handleCategoryClick(category)}
                />
            ))}
        </ul>
        
        {/* CHANGEMENT : Affichage des catégories sélectionnées */}
        {/* {selectedCategories.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                    <strong>Catégories sélectionnées ({selectedCategories.length}) :</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((category) => (
                        <span
                            key={category}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                            {category}
                        </span>
                    ))}
                </div>
            </div>
        )} */}

        {/* BONUS : Boutons d'action */}
        {/* <div className="mt-4 flex gap-2">
            <button
                onClick={() => setSelectedCategories([])}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={selectedCategories.length === 0}
            >
                Tout désélectionner
            </button>
            
            <button
                onClick={() => setSelectedCategories(categories)}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                disabled={selectedCategories.length === categories.length}
            >
                Tout sélectionner
            </button>
        </div> */}
      </div>
    </main>
  )
}