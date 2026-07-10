import nodemailer from 'nodemailer';

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  // En local: process.env.SMTP_HOST est vide, donc on prend 'chambrenoire-mailhog'
  // En prod: process.env.SMTP_HOST vaut 'smtp-relay.brevo.com'
  host: process.env.SMTP_HOST || 'chambrenoire-mailhog',
  port: parseInt(process.env.SMTP_PORT || '1025'), // 1025 pour Mailhog, 587 pour Brevo
  secure: false,

  // Authentification
  // Si les variables sont vides (local), Nodemailer n'authentifie pas (mailhog n'en a pas besoin)
  // Si les variables sont remplies (prod), Nodemailer authentifie (brevo en a besoin)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendNewPostNotification = async (subscribers: any[], post: any) => {
  if (!subscribers || subscribers.length === 0) return;

  console.log(`[NEWSLETTER SERVICE] Début de l'envoi à ${subscribers.length} abonnés...`);

  // URL dynamique
  // En local: process.env.FRONTEND_URL est vide -> 'http://localhost:8080'
  // En prod: process.env.FRONTEND_URL vaut 'https://helioscope.fr'
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const postUrl = `${baseUrl}/post/${post.slug}`;
 // // DEBUG: 
  console.log(`[URL]  Url utilisee  ${postUrl}`);

  for (const subscriber of subscribers) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Blog" <noreply@blog.com>',
        to: subscriber.email,
        subject: `Nouvel article : ${post.title}`,
        html: `
          <p>Bonjour,</p>
          <p>Un nouvel article a été publié : <strong>${post.title}</strong></p>
          <p><a href="${postUrl}">Lire l'article</a></p>
        `,
      });
      console.log(`[NEWSLETTER SERVICE] ✅ Mail envoyé à ${subscriber.email}`);
    } catch (error) {
      console.error(`[NEWSLETTER SERVICE] ❌ Erreur pour ${subscriber.email}`, error);
    }
  }
};
