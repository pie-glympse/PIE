import { useState } from 'react';
import type { FC, ChangeEvent } from 'react';
import Image from 'next/image';

interface Choice {
  id: string;
  text: string;
}

interface ChoiceLiProps {
  choices: Choice[];
  selectedChoices: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  otherPlaceholder?: string;
  singleSelection?: boolean;
}

const ChoiceLi: FC<ChoiceLiProps> = ({
  choices,
  selectedChoices,
  onSelectionChange,
  otherPlaceholder = "Autre préférence",
  singleSelection = false
}) => {
  const [otherValue, setOtherValue] = useState('');

  // Diviser les choices en deux listes
const midPoint = 6; // au lieu de Math.ceil(choices.length / 2)
const leftChoices = choices.slice(0, midPoint);   // 6 éléments (indices 0-5)
const rightChoices = choices.slice(midPoint);      // 3 éléments (indices 6-8)

  const handleChoiceClick = (choiceId: string) => {
    let newSelected: string[];
    if (singleSelection) {
      // En mode sélection unique, remplacer la sélection actuelle
      if (selectedChoices.includes(choiceId)) {
        newSelected = []; // Désélectionner si déjà sélectionné
      } else {
        newSelected = [choiceId]; // Sélectionner uniquement ce choix
      }
    } else {
      // En mode sélection multiple, ajouter/retirer de la liste
      if (selectedChoices.includes(choiceId)) {
        newSelected = selectedChoices.filter(id => id !== choiceId);
      } else {
        newSelected = [...selectedChoices, choiceId];
      }
    }
    onSelectionChange(newSelected);
  };

  const handleOtherChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherValue(value);
    
    // Créer un ID unique pour l'option "autre"
    const otherId = `other-${value}`;
    
    if (singleSelection) {
      // En mode sélection unique, remplacer toute sélection par "autre"
      if (value.trim()) {
        onSelectionChange([otherId]);
      } else {
        onSelectionChange([]);
      }
    } else {
      // En mode sélection multiple, supprimer les anciennes valeurs "autre" et ajouter la nouvelle
      const filteredSelected = selectedChoices.filter(id => !id.startsWith('other-'));
      
      // Ajouter la nouvelle valeur si elle n'est pas vide
      if (value.trim()) {
        onSelectionChange([...filteredSelected, otherId]);
      } else {
        onSelectionChange(filteredSelected);
      }
    }
  };

  return (
    <div className="flex flex-row justify-between gap-8 w-full">
      {/* Liste de gauche */}
      <div className="flex flex-col flex-1 text-body-large font-poppins text-[var(--color-text)]">
        <ul className="flex flex-col gap-3">
            <p>Alimentaire</p>
          {leftChoices.map((choice) => (
            <li 
              key={choice.id}
              className="flex items-center gap-[3px] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleChoiceClick(choice.id)}
            >
              <Image
                src={selectedChoices.includes(choice.id) ? "/icons/selected.svg" : "/icons/unselected.svg"}
                alt={selectedChoices.includes(choice.id) ? "Sélectionné" : "Non sélectionné"}
                width={32}
                height={32}
                sizes="32px"
              />
              <span className="font-poppins text-base">{choice.text}</span>
            </li>
          ))}
        </ul>
        
        {/* Input "Autre" en dessous de la liste de gauche */}
        <div className="mt-6 flex items-center gap-3">
          <span className="font-poppins text-body-large font-[var(--font-poppins)] text-[var(--color-text)]">Autre :</span>
          <input
            type="text"
            value={otherValue}
            onChange={handleOtherChange}
            placeholder={otherPlaceholder}
            className="flex-1 px-5 py-2 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
          />
        </div>
      </div>

      {/* Liste de droite */}
      <div className="flex-1 text-body-large font-poppins text-[var(--color-text)]">
        <ul className="flex flex-col gap-3">
            <p>Accéssibilité</p>
          {rightChoices.map((choice) => (
            <li 
              key={choice.id}
              className="flex items-center gap-[3px] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleChoiceClick(choice.id)}
            >
              <Image
                src={selectedChoices.includes(choice.id) ? "/icons/selected.svg" : "/icons/unselected.svg"}
                alt={selectedChoices.includes(choice.id) ? "Sélectionné" : "Non sélectionné"}
                width={32}
                height={32}
                sizes="32px"
              />
              <span className="font-poppins text-base">{choice.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChoiceLi;