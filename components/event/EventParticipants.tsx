import React from 'react';
import Image from 'next/image';

interface Participant {
    id: number;
    name: string;
    email: string;
}

interface EventParticipantsProps {
    participants?: Participant[];
}

const EventParticipants: React.FC<EventParticipantsProps> = ({ participants = [] }) => {

    const mockParticipants: Participant[] = [
        { id: 1, name: 'Olivia Rhye', email: 'oliviarhye@gmail.com' },
        { id: 2, name: 'John Doe', email: 'john.doe@example.com' },
        { id: 3, name: 'Jane Smith', email: 'jane.smith@example.com' },
        { id: 4, name: 'Mike Johnson', email: 'mike.johnson@example.com' },
        { id: 5, name: 'Sarah Wilson', email: 'sarah.wilson@example.com' },
        { id: 6, name: 'David Brown', email: 'david.brown@example.com' },
    ];

    const displayParticipants = participants.length > 0 ? participants : mockParticipants;

    return (
        <div>
            {displayParticipants.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    {displayParticipants.map((participant) => (
                        <div 
                            key={participant.id} 
                            className="flex items-center justify-between p-4 border rounded-lg"
                            style={{ borderColor: '#F4F4F4' }}
                        >
                            {/* Section gauche - Avatar + Infos */}
                            <div className="flex items-center gap-4">
                                {/* Avatar rond */}
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                <Image
                                    src="/icons/round.png"  
                                        alt={`Avatar de ${participant.name}`}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                </div>
                                
                                {/* Nom et email */}
                                <div>
                                    <h4 
                                        className="font-bold text-[var(--color-text)]"
                                        style={{ fontSize: '22px' }}
                                    >
                                        {participant.name}
                                    </h4>
                                    <p 
                                        className="text-[var(--color-grey-three)]"
                                        style={{ fontSize: '15px', fontWeight: '500' }}
                                    >
                                        {participant.email}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Section droite - 3 points verticaux */}
                            <div className="flex flex-col items-center gap-1">
                                <div 
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: '#9B9B9D' }}
                                ></div>
                                <div 
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: '#9B9B9D' }}
                                ></div>
                                <div 
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: '#9B9B9D' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-bodyLarge font-poppins text-[var(--color-grey-three)]">
                    Aucun participant pour cet événement.
                </p>
            )}
        </div>
    );
};

export default EventParticipants;