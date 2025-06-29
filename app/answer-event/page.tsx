"use client"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'
import MainButton from '../../components/ui/MainButton';
import Link from 'next/link';
import Image from 'next/image';
import BackArrow from '../../components/ui/BackArrow';
import CategoryBtn from '@/components/ui/CategoryBtn'

const AnswerEventPage = () => {
    const router = useRouter();
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

    const handleCategoryClick = (category: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            }
            return [...prev, category];
        });
    };

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            {/* Section gauche */}
            <div className="h-full w-full flex flex-col gap-6 items-start p-10">
                <p className='text-left'>LOGO ICI</p>
                <BackArrow onClick={() => router.back()} className="" />

                <div className="w-full flex flex-col">
                    <h1 className="text-h1 mb-4 text-left w-full font-urbanist">
Formulez vos Préférences pour NomEvent 
</h1>
                        <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
                            Sélectionnez une ou plusieurs catégories :
                        </h3>
                    
                    <div className="w-full">
                        <ul className="flex flex-wrap gap-3 mb-6 list-none">
                            {categories.map((category) => (
                                <CategoryBtn
                                    key={category}
                                    text={category}
                                    isSelected={selectedCategories.includes(category)}
                                    onClick={() => handleCategoryClick(category)}
                                />
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Spacer pour pousser le bouton vers le bas */}
                <div className="flex-grow" />
                
                {/* Bouton en bas */}
                <MainButton
                    text="Continuer"
                    onClick={() => {
                        // Logique pour continuer avec les catégories sélectionnées
                        console.log('Catégories sélectionnées:', selectedCategories);
                    }}
                    disabled={selectedCategories.length === 0}
                />
            </div>
        </section>
    );
};

export default AnswerEventPage;