import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from './variants';

const ContactView: React.FC = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      key="contact"
    >
      <h2 className="section-title">Me Contacter</h2>
      <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Message envoyé ! (Simulation)"); }}>
        <div>
          <label>Nom complet :</label>
          <input type="text" className="form-input" required placeholder="Votre nom" />
        </div>
        <div>
          <label>Adresse e-mail :</label>
          <input type="email" className="form-input" required placeholder="Votre email" />
        </div>
        <div>
          <label>Message :</label>
          <textarea rows={6} className="form-textarea" required placeholder="Votre message..."></textarea>
        </div>
        <button type="submit" className="btn-submit">Envoyer</button>
      </form>
    </motion.div>
  );
};

export default ContactView;
