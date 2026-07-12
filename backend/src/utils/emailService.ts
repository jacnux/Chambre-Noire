import nodemailer from 'nodemailer';

// Configuration du transporteur
const transporterOptions = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Fonction pour l'envoi de l'email de vérification
export const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport(transporterOptions);

  // Construction de l'URL de vérification
  // En local : http://localhost/verify-email?token=...
  // En prod : https://helioscope.fr/verify-email?token=...
  const baseUrl = process.env.CLIENT_URL
    || (process.env.NODE_ENV === 'production' ? 'https://helioscope.fr' : 'http://localhost');

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'test@helioscope.fr',
    to: email,
    subject: 'Hélioscope - Vérification de votre compte',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #EAB308;">Bienvenue sur Hélioscope !</h2>
        <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour activer votre compte :</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #EAB308; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Activer mon compte
        </a>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">Ce lien expire dans 24 heures.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Fonction pour l'envoi du mot de passe temporaire (NOUVEAU)
export const sendPasswordResetEmail = async (email: string, tempPassword: string) => {
  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: process.env.SMTP_FROM || 'test@helioscope.fr',
    to: email,
    subject: 'Hélioscope - Votre nouveau mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #EAB308;">Mot de passe réinitialisé</h2>
        <p>Bonjour,</p>
        <p>Un administrateur a réinitialisé votre mot de passe.</p>
        <p>Votre nouveau mot de passe temporaire est :</p>
        <div style="background: #f3f4f6; padding: 10px; font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px; border-radius: 5px;">
          ${tempPassword}
        </div>
        <p style="color: #666; font-size: 12px;">Nous vous conseillons de le changer dès votre prochaine connexion.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">L'équipe Hélioscope</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
