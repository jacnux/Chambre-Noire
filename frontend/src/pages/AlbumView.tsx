// =================================================
// 21 Mai2026 - Version 8.0 + Commentaires photos
//  AlbumView
// =================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

import Lightbox from '../components/Lightbox';
import EditPhotoModal from '../components/EditPhotoModal';
import PhotoInfoModal from '../components/PhotoInfoModal';

// ============================================================
// SOUS-COMPOSANT — Formulaire Commentaire
// ============================================================
const CommentForm = ({ photoId, onDone }: { photoId: string; onDone?: () => void }) => {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<'idle'|'sending'|'ok'|'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post(`/comments/${photoId}`, { authorName: name, authorEmail: email, message });
      setStatus('ok');
      setName(''); setEmail(''); setMessage('');
      if (onDone) setTimeout(onDone, 1500);
    } catch { setStatus('error'); }
  };

  if (status === 'ok') return <p className="text-green-400 text-sm py-4 text-center">✅ Merci pour votre commentaire !</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input required placeholder="Votre nom *" value={name} onChange={e => setName(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm" />
      <input type="email" placeholder="Votre email (facultatif)" value={email} onChange={e => setEmail(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm" />
      <textarea required rows={3} placeholder="Votre commentaire *" value={message} onChange={e => setMessage(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none" />
      {status === 'error' && <p className="text-red-400 text-xs">Une erreur est survenue, réessayez.</p>}
      <button type="submit" disabled={status === 'sending'}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50">
        {status === 'sending' ? 'Envoi...' : '💬 Envoyer'}
      </button>
    </form>
  );
};

// ============================================================
// SOUS-COMPOSANT — Modale Commentaire
// ============================================================






const CommentModal = ({ photo, onClose }: { photo: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">💬 Commenter</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <img src={`/uploads/${photo.filename}`} alt={photo.title}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-black/30" />
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{photo.title || "Sans titre"}</p>
          <p className="text-gray-400 text-sm truncate">{photo.description || "Pas de description"}</p>
        </div>
      </div>
      <CommentForm photoId={photo._id} onDone={onClose} />
    </div>
  </div>
);



// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const AlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [album, setAlbum]             = useState<any>(null);
  const [photos, setPhotos]           = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingPhoto, setEditingPhoto]   = useState<any | null>(null);
  const [infoPhoto, setInfoPhoto]         = useState<any | null>(null);
  const [commentPhoto, setCommentPhoto]   = useState<any>(null);
  const [pendingFiles, setPendingFiles]   = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestedTags, setSuggestedTags]   = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<'date_desc' | 'date_asc' | 'index'>('date_desc');

  const isViewer    = searchParams.get('mode') === 'viewer';
  const isSlideshow = searchParams.get('mode') === 'slideshow';

  useEffect(() => {
    if (!id) return;
    api.get(`/albums/${id}`).then(res => setAlbum(res.data)).catch(console.error);
    api.get(`/albums/photos/${id}`).then(res => setPhotos(res.data)).catch(console.error);
    api.get('/photos/tags').then(res => setSuggestedTags(res.data)).catch(() => {});
  }, [id]);

  const sortedPhotos = useMemo(() => {
    if (!photos.length) return [];
    const sorted = [...photos];
    if (sortMode === 'date_desc') sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortMode === 'date_asc') sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortMode === 'index') sorted.sort((a, b) => (a.index || 0) - (b.index || 0));
    return sorted;
  }, [photos, sortMode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f, i) => ({
        file: f, previewUrl: URL.createObjectURL(f), title: f.name, description: '',
        index: pendingFiles.length + i + 1, isCover: false, tag: '',
        applyWatermark: false, watermarkText: ''
      }));
      setPendingFiles([...pendingFiles, ...newFiles]);
    }
  };

  const handleSetCover = (indexToSet: number) =>
    setPendingFiles(pendingFiles.map((pf, i) => ({ ...pf, isCover: i === indexToSet })));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData();
    pendingFiles.forEach(pf => formData.append('photos', pf.file));
    formData.append('albumId', id);
    formData.append('metadata', JSON.stringify(pendingFiles.map(pf => ({
      index: pf.index, title: pf.title, description: pf.description,
      isCover: pf.isCover, originalName: pf.file.name, tag: pf.tag,
      applyWatermark: pf.applyWatermark, watermarkText: pf.watermarkText
    }))));
    try {
      setUploadProgress(1);
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setUploadProgress(100);
      setTimeout(() => { setPendingFiles([]); setUploadProgress(0); }, 1000);
      const response = await api.get(`/albums/photos/${id}`);
      setPhotos(response.data);
    } catch (err: any) {
      setUploadProgress(0);
      alert("Erreur upload: " + (err.response?.data?.error || err.message));
    }
  };

  const removePendingFile = (indexToRemove: number) =>
    setPendingFiles(pendingFiles.filter((_, i) => i !== indexToRemove));

  const handleShare = (photo: any) => {
    const shareUrl = `${window.location.origin}/uploads/${photo.filename}`;
    if (navigator.share) navigator.share({ title: photo.title, url: shareUrl }).catch(console.error);
    else if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).then(() => alert('Lien copié !'));
    else alert("Lien : " + shareUrl);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    await api.delete(`/photos/${photoId}`);
    setPhotos(photos.filter(p => p._id !== photoId));
  };

  const handleSavePhoto = async (updatedData: any) => {
    if (!editingPhoto) return;
    await api.put(`/photos/${editingPhoto._id}`, updatedData);
    setPhotos((await api.get(`/albums/photos/${id}`)).data);
    setEditingPhoto(null);
  };

  if (isSlideshow && photos.length > 0) return (
    <div className="w-full h-screen bg-black">
      <Lightbox photos={sortedPhotos} initialIndex={0} onClose={() => navigate(`/album/${id}?mode=viewer`)} />
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-gray-900">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative z-10 min-h-screen pb-20">

        {/* HEADER */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-3 sm:p-4 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-lg">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {!isViewer && <Link to="/dashboard" className="text-blue-300 hover:text-white text-sm transition">← Retour</Link>}
              <Link to="/dashboard" className="text-xl sm:text-2xl font-bold text-yellow-400 drop-shadow-lg tracking-wide">Hélioscope</Link>
            </div>
            <span className="text-sm text-white mt-1 ml-0 sm:ml-4 drop-shadow">
              Album : {album ? album.title : 'Chargement...'}
              {isViewer && <span className="text-xs text-gray-300 ml-2">(Public)</span>}
            </span>
          </div>

          <div className="w-full sm:w-auto flex gap-2 mt-2 sm:mt-0 flex-wrap justify-end">
            {!isViewer && (
              <label className="bg-green-500/50 hover:bg-green-600/80 text-white px-4 py-2 rounded-full cursor-pointer text-center text-sm transition border border-green-400/30">
                + Ajouter
                <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            )}
            {/* Switch Affichage */}
            <div className="bg-white/10 rounded-full p-1 flex gap-1 border border-white/10">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>
            {/* Boutons de tri */}
            {!isViewer && (
              <div className="bg-white/10 rounded-full p-1 flex gap-1 border border-white/10">
                <button onClick={() => setSortMode('date_desc')} className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'date_desc' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`} title="Plus récents">⬇️</button>
                <button onClick={() => setSortMode('date_asc')}  className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'date_asc'  ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`} title="Plus anciens">⬆️</button>
                <button onClick={() => setSortMode('index')}     className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'index'     ? 'bg-blue-500 text-white'   : 'text-gray-400 hover:text-white'}`} title="Ordre Manuel">#</button>
              </div>
            )}
          </div>
        </div>

        {/* Zone Upload */}
        {!isViewer && pendingFiles.length > 0 && (
          <div className="max-w-4xl mx-auto mt-6 bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">Photos à envoyer ({pendingFiles.length})</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start border-b border-white/10 pb-4">
                  <div className="w-full sm:w-auto flex justify-center relative">
                    <img src={pf.previewUrl} className="w-24 h-24 object-cover bg-black/30 rounded-lg" alt="Aperçu" />
                    <button type="button" onClick={() => handleSetCover(idx)}
                      className={`absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full text-sm shadow transition ${pf.isCover ? 'bg-yellow-400 text-black scale-110' : 'bg-white/20 text-white hover:bg-white/40'}`}
                      title="Définir couverture">★</button>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <input type="number" placeholder="#" value={pf.index}
                        onChange={e => { const n=[...pendingFiles]; n[idx].index=parseInt(e.target.value); setPendingFiles(n); }}
                        className="bg-white/10 border border-white/20 p-1 w-12 text-center text-sm text-white rounded" />
                      <input type="text" placeholder="Titre" value={pf.title}
                        onChange={e => { const n=[...pendingFiles]; n[idx].title=e.target.value; setPendingFiles(n); }}
                        className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                    </div>
                    <input list="tag-suggestions" type="text" placeholder="Tags (ex: portrait, paysage)" value={pf.tag}
                      onChange={e => { const n=[...pendingFiles]; n[idx].tag=e.target.value; setPendingFiles(n); }}
                      className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                    <datalist id="tag-suggestions">{suggestedTags.map((tag, i) => <option key={i} value={tag} />)}</datalist>
                    <input type="text" placeholder="Description" value={pf.description}
                      onChange={e => { const n=[...pendingFiles]; n[idx].description=e.target.value; setPendingFiles(n); }}
                      className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                    {/* Options filigrane */}
                    <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 space-y-2">
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={pf.applyWatermark || false}
                          onChange={e => { const n=[...pendingFiles]; n[idx].applyWatermark=e.target.checked; setPendingFiles(n); }}
                          className="w-4 h-4 rounded" />
                        <span>Appliquer un filigrane</span>
                      </label>
                      {pf.applyWatermark && (
                        <input type="text" placeholder="Texte (défaut: © Hélioscope)" value={pf.watermarkText || ''}
                          onChange={e => { const n=[...pendingFiles]; n[idx].watermarkText=e.target.value; setPendingFiles(n); }}
                          className="w-full bg-black/30 text-white text-xs p-2 rounded border border-white/10 mt-1" />
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => removePendingFile(idx)} className="text-red-300 hover:text-red-100 font-bold text-2xl px-2">×</button>
                </div>
              ))}
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-white/10">
                  <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
              <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-full hover:opacity-90 font-bold shadow-lg">Valider l'envoi</button>
            </form>
          </div>
        )}

        {/* Conteneur Photos */}
        <div className={viewMode === 'grid' ? "p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "p-4 space-y-3"}>
          {sortedPhotos.map((photo, idx) => (
            viewMode === 'grid' ? (
              <div key={photo._id} className="relative aspect-square bg-black/20 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                <img src={`/uploads/${photo.filename}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={photo.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-3 pointer-events-none">
                  <span className="text-white text-sm font-bold truncate drop-shadow-lg">{photo.title}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                      <span key={tIdx} className="bg-white/20 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
                {/* Boutons overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 z-20">
                  {/* Bouton Commenter — visible visiteur ET admin */}
                  <button onClick={e => { e.stopPropagation(); setCommentPhoto(photo); }}
                    className="w-8 h-8 bg-blue-600/80 backdrop-blur rounded-full shadow-lg text-white hover:bg-blue-600 flex items-center justify-center text-sm"
                    title="Commenter">💬</button>
                  {!isViewer && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setEditingPhoto(photo); }}
                        className="w-8 h-8 bg-white/20 backdrop-blur rounded-full shadow-lg text-white hover:bg-white/40 flex items-center justify-center"
                        title="Modifier">✏️</button>
                      <button onClick={e => { e.stopPropagation(); setInfoPhoto(photo); }}
                        className="w-8 h-8 bg-white/20 backdrop-blur rounded-full shadow-lg text-white hover:bg-white/40 flex items-center justify-center font-bold text-xs"
                        title="Info">i</button>
                      <button onClick={e => { e.stopPropagation(); handleShare(photo); }}
                        className="w-8 h-8 bg-white/20 backdrop-blur rounded-full shadow-lg text-white hover:bg-white/40 flex items-center justify-center"
                        title="Partager">🔗</button>
                      <button onClick={e => { e.stopPropagation(); handleDeletePhoto(photo._id); }}
                        className="w-8 h-8 bg-red-500/50 backdrop-blur rounded-full shadow-lg text-white hover:bg-red-500 flex items-center justify-center"
                        title="Supprimer">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Vue liste
              <div key={photo._id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 flex items-center gap-4 hover:bg-white/10 transition group">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-black/20 cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                  <img src={`/uploads/${photo.filename}`} alt="Thumb" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                  <h3 className="font-bold text-white truncate">{photo.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{photo.description || "Pas de description"}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                      <span key={tIdx} className="text-purple-300 text-[10px]">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:block text-xs text-gray-500 w-24 text-right">{new Date(photo.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {/* Bouton Commenter vue liste — visible visiteur ET admin */}
                  <button onClick={() => setCommentPhoto(photo)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition"
                    title="Commenter">💬</button>
                  {!isViewer && (
                    <>
                      <button onClick={() => setEditingPhoto(photo)} className="text-indigo-300 hover:text-indigo-100 text-sm">Modif</button>
                      <button onClick={() => handleDeletePhoto(photo._id)} className="text-red-300 hover:text-red-100 text-sm">Suppr</button>
                    </>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Modales */}
        {editingPhoto && <EditPhotoModal photo={editingPhoto} onClose={() => setEditingPhoto(null)} onSave={handleSavePhoto} />}
        {infoPhoto    && <PhotoInfoModal photo={infoPhoto}    onClose={() => setInfoPhoto(null)} />}
        {lightboxIndex !== null && (
          <Lightbox photos={sortedPhotos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
        {commentPhoto && (
          <CommentModal photo={commentPhoto} onClose={() => setCommentPhoto(null)} />
        )}

      </div>
    </div>
  );
};

export default AlbumView;
