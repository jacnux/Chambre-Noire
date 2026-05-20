// src/pages/CommentsPage.tsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

// ── Types ────────────────────────────────────────────────────────
interface Comment {
  _id: string;
  authorName: string;
  authorEmail: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  photoId?: { _id: string; title: string; filename: string };
}

interface PhotoGroup {
  photoId: string;
  title: string;
  filename: string;
  comments: Comment[];
}

// ── Regroupement par photo ───────────────────────────────────────
const groupByPhoto = (comments: Comment[]): PhotoGroup[] => {
  const map = new Map<string, PhotoGroup>();
  for (const c of comments) {
    const key   = c.photoId?._id || 'deleted';
    const title = c.photoId?.title    || 'Photo supprimée';
    const filename = c.photoId?.filename || '';
    if (!map.has(key)) map.set(key, { photoId: key, title, filename, comments: [] });
    map.get(key)!.comments.push(c);
  }
  // Tri : groupes avec non-lus en premier
  return Array.from(map.values()).sort((a, b) => {
    const aUnread = a.comments.filter(c => !c.isRead).length;
    const bUnread = b.comments.filter(c => !c.isRead).length;
    return bUnread - aUnread;
  });
};

// ── Modale de réponse ────────────────────────────────────────────
const ReplyModal = ({
  comment, onClose, onSent
}: { comment: Comment; onClose: () => void; onSent: (id: string) => void }) => {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/comments/${comment._id}/reply`, { replyMessage: text });
      onSent(comment._id);
      onClose();
    } catch {
      setError('Erreur lors de l\'envoi. Vérifiez votre configuration SMTP.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Répondre à {comment.authorName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Citation du commentaire original */}
        <div className="bg-black/30 border-l-4 border-blue-500/60 p-3 rounded-lg mb-4 text-sm text-gray-300 italic">
          "{comment.message}"
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Votre réponse..."
          rows={5}
          className="w-full bg-gray-800 border border-white/10 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500 transition"
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex justify-between items-center mt-4 gap-3">
          <span className="text-xs text-gray-500">
            → Envoi à : {comment.authorEmail}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 transition">
              Annuler
            </button>
            <button onClick={send} disabled={sending || !text.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition">
              {sending ? 'Envoi…' : '✉️ Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Composant principal ──────────────────────────────────────────
const CommentsPage = () => {
  const [comments, setComments]         = useState<Comment[]>([]);
  const [replyTarget, setReplyTarget]   = useState<Comment | null>(null);

  useEffect(() => {
    api.get('/comments/my').then(r => setComments(r.data));
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/comments/${id}/read`);
    setComments(prev => prev.map(c => c._id === id ? { ...c, isRead: true } : c));
  };

  const deleteComment = async (id: string) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    await api.delete(`/comments/${id}`);
    setComments(prev => prev.filter(c => c._id !== id));
  };

  const handleReplySent = (id: string) => {
    // Marquer comme lu côté frontend après réponse
    setComments(prev => prev.map(c => c._id === id ? { ...c, isRead: true } : c));
  };

  const unread  = comments.filter(c => !c.isRead).length;
  const groups  = groupByPhoto(comments);

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* En-tête */}
      <h1 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
        💬 Commentaires reçus
        {unread > 0 && (
          <span className="bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">
            {unread} nouveau{unread > 1 ? 'x' : ''}
          </span>
        )}
      </h1>

      {comments.length === 0 && (
        <p className="text-gray-400 bg-gray-800/50 rounded-xl p-8 text-center">
          Aucun commentaire pour le moment.
        </p>
      )}

      {/* Groupes par photo */}
      <div className="space-y-8">
        {groups.map(group => {
          const groupUnread = group.comments.filter(c => !c.isRead).length;
          return (
            <div key={group.photoId} className="rounded-2xl border border-white/10 bg-gray-800/30 overflow-hidden">

              {/* En-tête du groupe — vignette + titre photo */}
              <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-gray-800/50">
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black/30">
                  {group.filename ? (
                    <img
                      src={`/uploads/${group.filename}`}
                      alt={group.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">📷</div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-base">📷 {group.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {group.comments.length} commentaire{group.comments.length > 1 ? 's' : ''}
                    {groupUnread > 0 && (
                      <span className="ml-2 bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-xs">
                        {groupUnread} nouveau{groupUnread > 1 ? 'x' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Liste des commentaires de ce groupe */}
              <div className="divide-y divide-white/5">
                {group.comments.map(c => (
                  <div key={c._id}
                    className={`p-4 transition ${!c.isRead ? 'bg-blue-900/10' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-semibold text-sm text-white flex items-center gap-2 flex-wrap">
                          {c.authorName}
                          {c.authorEmail && (
                            <a href={`mailto:${c.authorEmail}`}
                               className="text-xs text-gray-400 hover:text-blue-400 transition font-normal">
                              {c.authorEmail}
                            </a>
                          )}
                          {!c.isRead && (
                            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              Nouveau
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-shrink-0">
                        {c.authorEmail && (
                          <button onClick={() => setReplyTarget(c)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition">
                            ✉️ Répondre
                          </button>
                        )}
                        {!c.isRead && (
                          <button onClick={() => markRead(c._id)}
                            className="text-xs text-green-400 hover:text-green-300 transition">
                            ✓ Lu
                          </button>
                        )}
                        <button onClick={() => deleteComment(c._id)}
                          className="text-xs text-red-400 hover:text-red-300 transition">
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="mt-2 text-sm text-gray-200 bg-black/20 p-3 rounded-lg leading-relaxed">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale de réponse */}
      {replyTarget && (
        <ReplyModal
          comment={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSent={handleReplySent}
        />
      )}
    </div>
  );
};

export default CommentsPage;
