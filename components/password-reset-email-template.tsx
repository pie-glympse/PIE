interface PasswordResetEmailTemplateProps {
  readonly resetLink: string;
  readonly userEmail: string;
}

export function PasswordResetEmailTemplate({ resetLink, userEmail }: Readonly<PasswordResetEmailTemplateProps>) {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '600px', 
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#333', 
            fontSize: '24px',
            margin: '0',
            fontWeight: 'bold'
          }}>
            🔐 Glyms
          </h1>
        </div>

        {/* Titre */}
        <h2 style={{ 
          color: '#333', 
          fontSize: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Réinitialisation de votre mot de passe
        </h2>

        {/* Message principal */}
        <p style={{ 
          color: '#555', 
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Bonjour,
        </p>

        <p style={{ 
          color: '#555', 
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>{userEmail}</strong>.
        </p>

        <p style={{ 
          color: '#555', 
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
        </p>

        {/* Bouton CTA */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <a 
            href={resetLink}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '14px 28px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Réinitialiser mon mot de passe
          </a>
        </div>

        {/* Lien alternatif */}
        <p style={{ 
          color: '#777', 
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </p>
        <p style={{ 
          color: '#007bff', 
          fontSize: '14px',
          wordBreak: 'break-all',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {resetLink}
        </p>

        {/* Avertissement de sécurité */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <p style={{ 
            color: '#856404', 
            fontSize: '14px',
            margin: '0',
            fontWeight: 'bold'
          }}>
            ⚠️ Important
          </p>
          <p style={{ 
            color: '#856404', 
            fontSize: '14px',
            margin: '5px 0 0 0'
          }}>
            Ce lien expire dans 15 minutes. Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{ 
            color: '#999', 
            fontSize: '12px',
            margin: '0'
          }}>
            Cet email a été envoyé par Glyms. Si vous avez des questions, contactez notre support.
          </p>
        </div>
      </div>
    </div>
  );
}