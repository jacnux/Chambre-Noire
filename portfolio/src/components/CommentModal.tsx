import React, { useState } from 'react';
import { Photo } from '../types';

interface CommentModalProps {
  photo: Photo;
  onClose: () => void;
  onSubmit: (authorName: string, authorEmail: string, message: string) => Promise<void>;
  submitting: boolean;
  success: string | null;
  error: string | null;
}

const CommentModal: React.FC<CommentModalProps> = ({
  photo,
  onClose,
  onSubmit,
  submitting,
  success,
  error,
}) => {
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(author, email, message).then(() => {
      // Clear message on success
      if (!error) {
        setMessage('');
      }
    });
  };

  return (
    <div className="lightbox-popup-overlay" onClick={onClose}>
      <div className="lightbox-popup-card" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h4>Ajouter un commentaire sur &laquo;&nbsp;{photo.title || 'la photo'}&nbsp;&raquo;</h4>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>
        
        {success && <div className="comment-alert success">{success}</div>}
        {error && <div className="comment-alert error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="lightbox-comment-form">
          <div className="form-group">
            <label>Nom :</label>
            <input 
              type="text" 
              value={author} 
              onChange={e => setAuthor(e.target.value)} 
              required 
              placeholder="Votre nom"
            />
          </div>
          <div className="form-group">
            <label>Email (optionnel) :</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="nom@exemple.com"
            />
          </div>
          <div className="form-group">
            <label>Message :</label>
            <textarea 
              rows={4} 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              required 
              placeholder="Laissez votre commentaire..."
            />
          </div>
          <div className="popup-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button 
              type="submit" 
              className="btn-submit-comment"
              disabled={submitting}
            >
              {submitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal;
