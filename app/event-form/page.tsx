"use client" // src/app/register/page.tsx
import EventForm from '@/components/forms/EventForm';
import BackArrow from '@/components/ui/BackArrow';

export default function EventFormPage() {

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col justify-between items-start gap-6 p-10">
                <div className="w-full flex flex-col justify-center">
                    <div>
                        <BackArrow onClick={() => window.history.back()} className="" />
                    </div>
                    <EventForm
                        title={
                            <>
                                Créez vos évènements personnalisés !<br />
                            </>
                        }
                        subtitle='Entrez les informations générales de l’événement'
                        buttonText="Créer l'événement"
                    />
                </div>
            </div>
        </section>
    );
}