import React from 'react';

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-h1 font-[var(--font-urbanist)] text-[var(--color-text)] mb-4">
            Guide de Style
          </h1>
          <p className="text-body-large text-[var(--color-grey-three)]">
            Référence visuelle de tous les styles personnalisés du projet
          </p>
        </div>

        {/* Typographie */}
        <section className="mb-16">
          <h2 className="text-h2 font-[var(--font-poppins)] text-[var(--color-text)] mb-8 pb-4 border-b border-[var(--color-grey-two)]">
            Typographie
          </h2>
          
          <div className="space-y-8">
            {/* Titre H1 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="mb-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                  .text-h1
                </code>
                <span className="text-sm text-[var(--color-grey-three)] ml-4">
                  33px • Line-height: 1.2 • Weight: 600
                </span>
              </div>
              <h1 className="text-h1 font-[var(--font-urbanist)] text-[var(--color-text)]">
                Titre Principal H1
              </h1>
            </div>

            {/* Titre H2 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="mb-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                  .text-h2
                </code>
                <span className="text-sm text-[var(--color-grey-three)] ml-4">
                  24px • Line-height: 1.3 • Weight: 500
                </span>
              </div>
              <h2 className="text-h2 font-[var(--font-poppins)] text-[var(--color-text)]">
                Titre Secondaire H2
              </h2>
            </div>

            {/* Titre H3 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="mb-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                  .text-h3
                </code>
                <span className="text-sm text-[var(--color-grey-three)] ml-4">
                  22px • Line-height: 1.3 • Weight: 500
                </span>
              </div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)]">
                Titre Tertiaire H3
              </h3>
            </div>

            {/* Body Large */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="mb-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                  .text-body-large
                </code>
                <span className="text-sm text-[var(--color-grey-three)] ml-4">
                  19px • Line-height: 1.5 • Weight: 500
                </span>
              </div>
              <p className="text-body-large font-[var(--font-poppins)] text-[var(--color-text)]">
                Texte de corps large. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            {/* Body Small */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="mb-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                  .text-body-small
                </code>
                <span className="text-sm text-[var(--color-grey-three)] ml-4">
                  16px • Line-height: 1.5 • Weight: 500
                </span>
              </div>
              <p className="text-body-small font-[var(--font-poppins)] text-[var(--color-text)]">
                Texte de corps petit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </div>
        </section>

        {/* Couleurs */}
        <section className="mb-16">
          <h2 className="text-h2 font-[var(--font-poppins)] text-[var(--color-text)] mb-8 pb-4 border-b border-[var(--color-grey-two)]">
            Palette de Couleurs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Couleur Principale */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-24 bg-[var(--color-main)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Principale
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-main)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #FCC638
              </p>
            </div>

            {/* Couleur Secondaire */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-24 bg-[var(--color-secondary)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Secondaire
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-secondary)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #FF5B5B
              </p>
            </div>

            {/* Couleur Tertiaire */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-24 bg-[var(--color-tertiary)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Tertiaire
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-tertiary)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #F78AFF
              </p>
            </div>

            {/* Couleur Validation */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-24 bg-[var(--color-validate)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Validation
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-validate)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #2B983F
              </p>
            </div>

            {/* Couleur Texte */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-24 bg-[var(--color-text)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Texte
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-text)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #191919
              </p>
            </div>
          </div>
        </section>

        {/* Nuances de Gris */}
        <section className="mb-16">
          <h2 className="text-h2 font-[var(--font-poppins)] text-[var(--color-text)] mb-8 pb-4 border-b border-[var(--color-grey-two)]">
            Nuances de Gris
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gris 1 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg border">
              <div className="w-full h-16 bg-[var(--color-grey-one)] rounded-lg mb-4 border"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Gris Un
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-grey-one)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #F4F4F4
              </p>
            </div>

            {/* Gris 2 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-16 bg-[var(--color-grey-two)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Gris Deux
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-grey-two)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #EAEAEF
              </p>
            </div>

            {/* Gris 3 */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <div className="w-full h-16 bg-[var(--color-grey-three)] rounded-lg mb-4"></div>
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-2">
                Gris Trois
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)]">
                var(--color-grey-three)
              </code>
              <p className="text-body-small text-[var(--color-grey-three)] mt-2">
                #9B9B9B
              </p>
            </div>
          </div>
        </section>

        {/* Polices */}
        <section className="mb-16">
          <h2 className="text-h2 font-[var(--font-poppins)] text-[var(--color-text)] mb-8 pb-4 border-b border-[var(--color-grey-two)]">
            Familles de Polices
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urbanist */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-4">
                Urbanist
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)] mb-4 block w-fit">
                font-[var(--font-urbanist)]
              </code>
              <div className="space-y-2">
                <p className="text-body-large font-[var(--font-urbanist)] text-[var(--color-text)]">
                  Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                </p>
                <p className="text-body-large font-[var(--font-urbanist)] text-[var(--color-text)]">
                  Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                </p>
                <p className="text-body-large font-[var(--font-urbanist)] text-[var(--color-text)]">
                  0123456789 !@#$%^&*()
                </p>
              </div>
            </div>

            {/* Poppins */}
            <div className="p-6 bg-[var(--color-grey-one)] rounded-lg">
              <h3 className="text-h3 font-[var(--font-poppins)] text-[var(--color-text)] mb-4">
                Poppins
              </h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded text-[var(--color-text)] mb-4 block w-fit">
                font-[var(--font-poppins)]
              </code>
              <div className="space-y-2">
                <p className="text-body-large font-[var(--font-poppins)] text-[var(--color-text)]">
                  Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                </p>
                <p className="text-body-large font-[var(--font-poppins)] text-[var(--color-text)]">
                  Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                </p>
                <p className="text-body-large font-[var(--font-poppins)] text-[var(--color-text)]">
                  0123456789 !@#$%^&*()
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}