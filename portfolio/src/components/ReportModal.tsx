import React, { useState } from 'react';
import { Photo } from '../types';

interface ReportModalProps {
  photo: Photo;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  submitting: boolean;
  success: string | null;
  error: string | null;
}

const ReportModal: React.FC<ReportModalProps> = ({
  photo,
  onClose,
  onSubmit,
  submitting,
  success,
  error,
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason).then(() => {
      if (!error) {
        setReason('');
      }
    });
  };

  return (
    <div className="lightbox-popup-overlay" onClick={onClose}>
      <div className="lightbox-popup-card" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h4 style={{ color: '#ef4444' }}>Signaler l'image &laquo;&nbsp;{photo.title || 'Sans titre'}&nbsp;&raquo;</h4>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>
        
        {success && <div className="comment-alert success">{success}</div>}
        {error && <div className="comment-alert error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="lightbox-comment-form">
          <p style={{ fontSize: '0.8rem', color: '#b3b3b3', marginBottom: '10px' }}>
            Veuillez indiquer la raison pour laquelle vous estimez cette image inappropriée.
          </p>
          <div className="form-group">
            <label>Raison du signalement :</label>
            <textarea 
              rows={4} 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              required 
              placeholder="Ex: Image inappropriée, droit d'auteur..."
            />
          </div>
          <div className="popup-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button 
              type="submit" 
              className="btn-submit-comment"
              style={{ backgroundColor: '#ef4444' }}
              disabled={submitting}
            >
              {submitting ? "Envoi..." : "Signaler"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
