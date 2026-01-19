import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Tailwind, Text } from '@react-email/components';

interface SetPasswordEmailTemplateProps {
  readonly setPasswordLink: string;
  readonly userEmail: string;
  readonly firstName: string;
  readonly isOwner: boolean;
}

export function SetPasswordEmailTemplate({ 
  setPasswordLink, 
  userEmail,
  firstName,
  isOwner
}: Readonly<SetPasswordEmailTemplateProps>) {
  const previewText = `Créez votre mot de passe pour accéder à Glyms`;
  
  const logoUrl = `${process.env.NEXT_PUBLIC_URL}/images/logo/Logotype.svg`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[600px]">
            {/* Logo Section */}
            <Section className="mt-10 text-center">
              <Img
                src={logoUrl}
                width="150"
                height="40"
                alt="Logo Glyms"
                className="my-0 mx-auto"
              />
            </Section>

            {/* Main Heading */}
            <Heading className="text-2xl text-gray-800 font-bold text-center p-0 my-8 mx-0">
              🎉 Bienvenue sur Glyms !
            </Heading>

            {/* White Card Container */}
            <Section className="bg-white rounded-lg shadow-lg p-8 my-6">
              {/* Greeting */}
              <Text className="text-start text-base text-gray-700 leading-relaxed mb-4">
                Bonjour {firstName || 'Cher utilisateur'},
              </Text>

              {/* Main Message */}
              <Text className="text-start text-base text-gray-700 leading-relaxed mb-4">
                {isOwner 
                  ? `Votre compte administrateur a été créé pour votre entreprise sur Glyms.`
                  : `Votre compte a été créé par votre entreprise sur Glyms.`
                }
              </Text>

              <Text className="text-start text-base text-gray-700 leading-relaxed mb-6">
                Pour commencer, vous devez créer votre mot de passe en cliquant sur le bouton ci-dessous :
              </Text>

              {/* CTA Button */}
              <Section className="text-center mt-8 mb-8">
                <Button
                  className="py-3 px-8 bg-blue-600 rounded-lg text-white text-base font-semibold no-underline text-center inline-block"
                  href={setPasswordLink}
                >
                  Créer mon mot de passe
                </Button>
              </Section>

              {/* Alternative Link */}
              <Text className="text-start text-sm text-gray-600 leading-relaxed mb-2">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </Text>
              
              <Section className="bg-gray-100 rounded-md p-3 mb-6">
                <Text className="text-xs text-blue-600 break-all font-mono">
                  {setPasswordLink}
                </Text>
              </Section>

              {/* Security Warning */}
              <Section className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
                <Text className="text-sm text-amber-800 font-semibold mb-2">
                  ⚠️ Important
                </Text>
                <Text className="text-sm text-amber-700 m-0">
                  Ce lien expire dans 7 jours. Si vous n&apos;avez pas demandé ce compte, contactez votre administrateur.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="text-center mt-8 pt-6 border-t border-gray-200">
              <Text className="text-xs text-gray-500 m-0">
                Cet email a été envoyé par <strong>Glyms</strong>. Si vous avez des questions, contactez notre support : <strong>contact@glyms-app.fr</strong>
              </Text>
              <Text className="text-xs text-gray-400 mt-2 m-0">
                © 2025 Glyms. Tous droits réservés.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
