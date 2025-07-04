"use client" // src/app/register/page.tsx
import ContactForm from '@/components/forms/ContactForm';

export default function ContactFormPage() {

    return (
        <section className="flex flex-row h-screen items-center gap-10 p-10">
            <div className="h-full w-full flex flex-col justify-between items-start gap-6 p-10">
                <div className="w-full flex justify-center">
                    <ContactForm
                        title={
                            <>
                                Contactez-nous,<br />
                                Nous sommes là pour vous aider
                            </>
                        }
                        buttonText="Envoyer"
                        placeholderEmail="ex : votre@email.com"
                        placeholderObjet="ex : Objet de votre message"
                        placeholderMessage="ex : Votre message..."
                    />
                </div>
            </div>
        </section>
    );
}