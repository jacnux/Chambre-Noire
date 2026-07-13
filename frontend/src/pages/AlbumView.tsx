// =================================================
// 23 Mai 2026 - Version 8.9
// + tri alphabétique toggle A→Z / Z→A sur les photos
// AlbumView
// =================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getSubdomain } from '../utils/domain';
import Lightbox from '../components/Lightbox';
import EditPhotoModal from '../components/EditPhotoModal';
import PhotoInfoModal from '../components/PhotoInfoModal';

// ============================================================
// SOUS-COMPOSANT — Formulaire Commentaire
// ============================================================
const CommentForm = ({ photoId, onDone }: { photoId: string; onDone?: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await api.post(`/comments/${photoId}`, { authorName: name, authorEmail: email, message });
      setStatus('ok');
      setName('');
      setEmail('');
      setMessage('');
      if (onDone) setTimeout(onDone, 1500);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return <p className="text-green-400 text-sm py-4 text-center">✅ Merci pour votre commentaire !</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required
        placeholder="Votre nom *"
        value={name}
        onChange={e => setName(e.target.value)}
        className="bg-surface border border-line-strong rounded-lg px-3 py-2 text-fg placeholder-gray-400 text-sm"
      />
      <input
        type="email"
        placeholder="Votre email (facultatif)"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="bg-surface border border-line-strong rounded-lg px-3 py-2 text-fg placeholder-gray-400 text-sm"
      />
      <textarea
        required
        rows={3}
        placeholder="Votre commentaire *"
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="bg-surface border border-line-strong rounded-lg px-3 py-2 text-fg placeholder-gray-400 text-sm resize-none"
      />
      {status === 'error' && <p className="text-red-400 text-xs">Une erreur est survenue, réessayez.</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-accent hover:opacity-90 text-bg text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
      >
        {status === 'sending' ? 'Envoi...' : '💬 Envoyer'}
      </button>
    </form>
  );
};

// ============================================================
// SOUS-COMPOSANT — Modale Commentaire
// ============================================================
const CommentModal = ({ photo, onClose }: { photo: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="bg-bg border border-line rounded-2xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-fg">💬 Commenter</h3>
        <button onClick={onClose} className="text-muted hover:text-fg text-xl">✕</button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={`/uploads/${photo.filename}`}
          alt={photo.title}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-surface-2"
        />
        <div className="min-w-0">
          <p className="text-fg font-medium truncate">{photo.title || 'Sans titre'}</p>
          <p className="text-muted text-sm truncate">{photo.description || 'Pas de description'}</p>
        </div>
      </div>
      <CommentForm photoId={photo._id} onDone={onClose} />
    </div>
  </div>
);

// ============================================================
// SOUS-COMPOSANT — Modale d'intégration (Embed)
// ============================================================
const EmbedModal = ({ albumId, isPublic, onClose }: { albumId: string; isPublic: boolean; onClose: () => void }) => {
  const embedUrl = `${window.location.origin}/embed/album/${albumId}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" style="border:0; border-radius:12px; overflow:hidden;" allowfullscreen></iframe>`;
  const apiAlbumUrl = `${window.location.origin}/api/albums/${albumId}`;
  const apiPhotosUrl = `${window.location.origin}/api/albums/photos/${albumId}`;

  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedApiAlbum, setCopiedApiAlbum] = useState(false);
  const [copiedApiPhotos, setCopiedApiPhotos] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-bg border border-line rounded-2xl w-full max-w-2xl p-6 text-fg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            🔌 Intégrer cette galerie
          </h3>
          <button onClick={onClose} className="text-muted hover:text-fg text-xl">✕</button>
        </div>
        
        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">
          {!isPublic && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-xs">
              ⚠️ <strong>Attention :</strong> Cette galerie est actuellement <strong>privée</strong>. Pour que l'intégration fonctionne sur d'autres sites, vous devez d'abord la rendre <strong>publique</strong> (via l'interrupteur de visibilité de l'album).
            </div>
          )}

          {/* Iframe Option */}
          <div>
            <h4 className="text-sm font-semibold text-yellow-500 mb-2">Option 1 : Intégration Iframe (Clé en main)</h4>
            <p className="text-xs text-muted mb-2">
              Copiez ce code HTML pour afficher la galerie directement sur votre site (WordPress, blog, portfolio, etc.).
            </p>
            <div className="relative">
              <pre className="bg-surface-2 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-line pr-20 select-all whitespace-pre-wrap break-all">
                {iframeCode}
              </pre>
              <button
                onClick={() => copyToClipboard(iframeCode, setCopiedIframe)}
                className="absolute right-2 top-2 bg-accent hover:opacity-90 text-bg text-xs px-3 py-1 rounded-lg transition"
              >
                {copiedIframe ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Lien Direct Option */}
          <div>
            <h4 className="text-sm font-semibold text-yellow-500 mb-2">Lien direct de partage</h4>
            <div className="relative">
              <pre className="bg-surface-2 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-line pr-20 select-all break-all">
                {embedUrl}
              </pre>
              <button
                onClick={() => copyToClipboard(embedUrl, setCopiedUrl)}
                className="absolute right-2 top-2 bg-accent hover:opacity-90 text-bg text-xs px-3 py-1 rounded-lg transition"
              >
                {copiedUrl ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Developer API Option */}
          <div>
            <h4 className="text-sm font-semibold text-yellow-500 mb-2">Option 2 : API JSON (Pour développeurs)</h4>
            <p className="text-xs text-muted mb-2">
              Utilisez nos API REST pour récupérer les données brutes (JSON) et créer votre propre interface.
            </p>
            
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-muted mb-1">Détails de l'album :</div>
                <div className="relative">
                  <pre className="bg-surface-2 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-line pr-20 select-all break-all">
                    {apiAlbumUrl}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(apiAlbumUrl, setCopiedApiAlbum)}
                    className="absolute right-2 top-2 bg-surface-2 hover:bg-line-strong text-fg text-xs px-2 py-1 rounded-lg transition"
                  >
                    {copiedApiAlbum ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-muted mb-1">Liste des photos :</div>
                <div className="relative">
                  <pre className="bg-surface-2 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-line pr-20 select-all break-all">
                    {apiPhotosUrl}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(apiPhotosUrl, setCopiedApiPhotos)}
                    className="absolute right-2 top-2 bg-surface-2 hover:bg-line-strong text-fg text-xs px-2 py-1 rounded-lg transition"
                  >
                    {copiedApiPhotos ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-surface hover:bg-surface-2 text-fg text-sm px-4 py-2 rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const AlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [infoPhoto, setInfoPhoto] = useState<any>(null);
  const [commentPhoto, setCommentPhoto] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // ✅ sortMode étendu avec alpha-asc et alpha-desc
  const [sortMode, setSortMode] = useState<'datedesc' | 'dateasc' | 'index' | 'alpha-asc' | 'alpha-desc'>('datedesc');

  const isViewer = searchParams.get('mode') === 'viewer';
  const isSlideshow = searchParams.get('mode') === 'slideshow';
  const isPublicContext = isViewer || album?.isPublic;
  const subdomain = getSubdomain();

  useEffect(() => {
    if (!id) return;
    api.get(`/albums/${id}`).then(res => setAlbum(res.data)).catch(console.error);
    api.get(`/albums/photos/${id}`).then(res => setPhotos(res.data)).catch(console.error);
    api.get('/photos/tags').then(res => setSuggestedTags(res.data)).catch(() => {});
  }, [id]);

  // ✅ useMemo étendu avec alpha-asc et alpha-desc
  const sortedPhotos = useMemo(() => {
    if (!photos.length) return [];
    const sorted = [...photos];
    if (sortMode === 'datedesc')
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortMode === 'dateasc')
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortMode === 'index')
      sorted.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    else if (sortMode === 'alpha-asc')
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }));
    else if (sortMode === 'alpha-desc')
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'fr', { sensitivity: 'base' }));
    return sorted;
  }, [photos, sortMode]);

  const hasPhotos = sortedPhotos.length > 0;
  const canAddPhotos = !isViewer;

  const actionsBarWrapperClass = isViewer
    ? 'px-4 pt-3 sticky top-[76px] sm:top-[88px] z-20 px-4 pt-4'
    : 'px-4 pt-4 sticky top-[76px] sm:top-[88px] z-20';

  const locationState = location.state as { fromPortfolio?: boolean; portfolioPath?: string; portfolioLabel?: string } | null;
  const viewerBackLink = locationState?.portfolioPath || subdomain ? null : null;
  const viewerBackLabel = locationState?.portfolioLabel || 'Retour au portfolio';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f, i) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        title: f.name,
        description: '',
        index: pendingFiles.length + i + 1,
        isCover: false,
        tag: '',
        applyWatermark: false,
        watermarkText: '',
      }));
      setPendingFiles([...pendingFiles, ...newFiles]);
    }
  };

  const handleSetCover = (indexToSet: number) => {
    setPendingFiles(pendingFiles.map((pf, i) => ({ ...pf, isCover: i === indexToSet })));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData();
    pendingFiles.forEach(pf => formData.append('photos', pf.file));
    formData.append('albumId', id);
    formData.append('metadata', JSON.stringify(
      pendingFiles.map(pf => ({
        index: pf.index,
        title: pf.title,
        description: pf.description,
        isCover: pf.isCover,
        originalName: pf.file.name,
        tag: pf.tag,
        applyWatermark: pf.applyWatermark,
        watermarkText: pf.watermarkText,
      }))
    ));
    try {
      setUploadProgress(1);
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          if (progressEvent.total)
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });
      setUploadProgress(100);
      setTimeout(() => { setPendingFiles([]); setUploadProgress(0); }, 1000);
      const response = await api.get(`/albums/photos/${id}`);
      setPhotos(response.data);
    } catch (err: any) {
      setUploadProgress(0);
      alert('Erreur upload: ' + (err.response?.data?.error || err.message));
    }
  };

  const removePendingFile = (indexToRemove: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== indexToRemove));
  };

  const handleShare = (photo: any) => {
    const shareUrl = `${window.location.origin}/uploads/${photo.filename}`;
    if (navigator.share) {
      navigator.share({ title: photo.title, url: shareUrl }).catch(console.error);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => alert('Lien copié !'));
    } else {
      alert('Lien: ' + shareUrl);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    await api.delete(`/photos/${photoId}`);
    setPhotos(photos.filter(p => p._id !== photoId));
  };

  const handleSavePhoto = async (updatedData: any) => {
    if (!editingPhoto) return;
    await api.put(`/photos/${editingPhoto._id}`, updatedData);
    setPhotos((await api.get(`/albums/photos/${id}`)).data);
    setEditingPhoto(null);
  };

  if (isSlideshow && photos.length > 0) {
    return (
      <div className="w-full h-screen bg-black">
        <Lightbox photos={sortedPhotos} initialIndex={0} onClose={() => navigate(`/albums/${id}?mode=viewer`, { state: location.state })} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-bg">
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 min-h-screen pb-20">

        {/* BARRE DE CONTEXTE */}
        <div className="px-4 pt-4">
          <div className="max-w-6xl mx-auto border rounded-2xl bg-surface border-line px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {isViewer ? (
                    locationState?.portfolioPath ? (
                      <Link to={locationState.portfolioPath} className="text-muted hover:text-fg transition">
                        {viewerBackLabel}
                      </Link>
                    ) : (
                      <span className="text-muted">Album public</span>
                    )
                  ) : (
                    <Link to="/dashboard" className="text-accent hover:text-fg transition">
                      Retour
                    </Link>
                  )}
                  <span className="text-muted">/</span>
                  <span className="text-fg">Album</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className={`font-bold text-fg truncate ${isViewer ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
                    {album ? album.title : 'Chargement...'}
                  </h1>
                  {isViewer && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-surface-2 text-fg border border-line">Public</span>
                  )}
                </div>
                {album?.description && (
                  <p className={`text-muted mt-2 line-clamp-2 ${isViewer ? 'text-xs sm:text-sm' : 'text-sm'}`}>{album.description}</p>
                )}
              </div>
              {!isViewer && isPublicContext && (
                <div className="text-xs text-muted sm:text-right">Consultation album</div>
              )}
            </div>
          </div>
        </div>

        {/* Zone Upload */}
        {canAddPhotos && pendingFiles.length > 0 && (
          <div className="max-w-4xl mx-auto mt-6 bg-surface border border-line-strong p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 text-fg">Photos à envoyer ({pendingFiles.length})</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start border-b border-line pb-4">
                  <div className="w-full sm:w-auto flex justify-center relative">
                    <img src={pf.previewUrl} className="w-24 h-24 object-cover bg-surface-2 rounded-lg" alt="Aperçu" />
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      className={`absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full text-sm shadow transition ${pf.isCover ? 'bg-yellow-400 text-black scale-110' : 'bg-surface-2 text-fg hover:bg-line-strong'}`}
                      title="Définir couverture"
                    >★</button>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="#"
                        value={pf.index}
                        onChange={e => { const n = [...pendingFiles]; n[idx].index = parseInt(e.target.value); setPendingFiles(n); }}
                        className="bg-surface border border-line-strong p-1 w-12 text-center text-sm text-fg rounded"
                      />
                      <input
                        type="text"
                        placeholder="Titre"
                        value={pf.title}
                        onChange={e => { const n = [...pendingFiles]; n[idx].title = e.target.value; setPendingFiles(n); }}
                        className="bg-surface border border-line-strong p-2 w-full text-sm text-fg rounded placeholder-gray-400"
                      />
                    </div>
                    <input
                      list="tag-suggestions"
                      type="text"
                      placeholder="Tags (ex: portrait, paysage)"
                      value={pf.tag}
                      onChange={e => { const n = [...pendingFiles]; n[idx].tag = e.target.value; setPendingFiles(n); }}
                      className="bg-surface border border-line-strong p-2 w-full text-sm text-fg rounded placeholder-gray-400"
                    />
                    <datalist id="tag-suggestions">
                      {suggestedTags.map((tag, i) => <option key={i} value={tag} />)}
                    </datalist>
                    <input
                      type="text"
                      placeholder="Description"
                      value={pf.description}
                      onChange={e => { const n = [...pendingFiles]; n[idx].description = e.target.value; setPendingFiles(n); }}
                      className="bg-surface border border-line-strong p-2 w-full text-sm text-fg rounded placeholder-gray-400"
                    />
                    <div className="mt-2 bg-surface p-3 rounded-lg border border-line space-y-2">
                      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pf.applyWatermark || false}
                          onChange={e => { const n = [...pendingFiles]; n[idx].applyWatermark = e.target.checked; setPendingFiles(n); }}
                          className="w-4 h-4 rounded"
                        />
                        <span>Appliquer un filigrane</span>
                      </label>
                      {pf.applyWatermark && (
                        <input
                          type="text"
                          placeholder="Texte (défaut: Hélioscope)"
                          value={pf.watermarkText}
                          onChange={e => { const n = [...pendingFiles]; n[idx].watermarkText = e.target.value; setPendingFiles(n); }}
                          className="w-full bg-surface-2 text-fg text-xs p-2 rounded border border-line mt-1"
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingFile(idx)}
                    className="text-red-300 hover:text-red-100 font-bold text-2xl px-2"
                  >×</button>
                </div>
              ))}
              {uploadProgress > 0 && (
                <div className="w-full bg-surface-2 rounded-full h-4 overflow-hidden border border-line">
                  <div
                    className="bg-accent h-4 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <button type="submit" className="w-full bg-accent text-bg py-3 rounded-full hover:opacity-90 font-bold">
                Valider l'envoi
              </button>
            </form>
          </div>
        )}

        {/* BARRE D'ACTIONS */}
        {hasPhotos && (
          <div className={actionsBarWrapperClass}>
            <div className={`max-w-6xl mx-auto rounded-2xl flex justify-between items-center gap-3 ${isViewer ? 'bg-surface border border-white/5 px-3 py-2' : 'bg-surface border border-line-strong px-3 py-3'} flex-col sm:flex-row items-start sm:items-center`}>

              {!isViewer && (
                <div className="flex flex-wrap items-center gap-2">
                  {canAddPhotos && (
                    <label className="bg-green-500/50 hover:bg-green-600/80 text-fg px-4 py-2 rounded-full cursor-pointer text-center text-sm transition border border-green-400/30">
                      Ajouter
                      <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}
                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="bg-accent hover:opacity-90 text-bg px-4 py-2 rounded-full text-center text-sm transition border border-blue-400/30"
                  >
                    🔌 Intégrer
                  </button>
                </div>
              )}

              <div className={`flex flex-wrap items-center gap-2 ${isViewer ? 'w-full justify-between sm:justify-end' : 'w-full sm:w-auto'}`}>

                {/* Affichage grille/liste */}
                {isViewer && <div className="text-[11px] uppercase tracking-wide text-muted">Affichage</div>}
                <div className={`rounded-full p-1 flex gap-1 ${isViewer ? 'bg-surface border border-white/5' : 'bg-surface border border-line'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`transition ${isViewer ? 'px-3 py-1.5 text-xs' : 'p-2'} rounded-full ${viewMode === 'grid' ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
                    title="Vue grille"
                  >
                    {isViewer ? 'Grille' : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`transition ${isViewer ? 'px-3 py-1.5 text-xs' : 'p-2'} rounded-full ${viewMode === 'list' ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
                    title="Vue liste"
                  >
                    {isViewer ? 'Liste' : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                  {/* ✅ Bouton toggle A→Z / Z→A — visible viewer ET admin */}
                  <button
                    onClick={() => setSortMode(sortMode === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc')}
                    className={`px-2 py-1 rounded-full transition text-xs font-bold border ${
                      sortMode === 'alpha-asc' || sortMode === 'alpha-desc'
                        ? 'bg-green-500 text-fg border-green-400'
                        : 'bg-surface text-muted hover:text-fg border-line'
                    }`}
                    title={sortMode === 'alpha-asc' ? 'Basculer Z→A' : 'Trier A→Z'}
                  >
                    {sortMode === 'alpha-asc' ? 'Z→A' : 'A→Z'}
                  </button>
                </div>

                {/* Boutons de tri — admin seulement */}
                {!isViewer && (
                  <div className="bg-surface rounded-full p-1 flex gap-1 border border-line">
                    <button
                      onClick={() => setSortMode('datedesc')}
                      className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'datedesc' ? 'bg-yellow-500 text-black' : 'text-muted hover:text-fg'}`}
                      title="Plus récents"
                    >↓</button>
                    <button
                      onClick={() => setSortMode('dateasc')}
                      className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'dateasc' ? 'bg-yellow-500 text-black' : 'text-muted hover:text-fg'}`}
                      title="Plus anciens"
                    >↑</button>
                    <button
                      onClick={() => setSortMode('index')}
                      className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'index' ? 'bg-accent text-bg' : 'text-muted hover:text-fg'}`}
                      title="Ordre manuel"
                    >#</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAT VIDE — bouton Ajouter */}
        {canAddPhotos && !hasPhotos && pendingFiles.length === 0 && (
          <div className="max-w-4xl mx-auto px-4 pt-6">
            <div className="bg-surface border border-line-strong rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-fg">Cet album est vide</h2>
                  <p className="text-sm text-muted mt-1">Ajoutez vos premières photos pour afficher la grille, la liste et les options de tri.</p>
                </div>
                <label className="bg-green-500/60 hover:bg-green-600/80 text-fg px-5 py-3 rounded-full cursor-pointer text-sm font-medium transition border border-green-400/30">
                  Ajouter
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* CONTENEUR PHOTOS */}
        {hasPhotos && (
          <div className={viewMode === 'grid'
            ? 'p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
            : 'p-4 space-y-3'
          }>
            {sortedPhotos.map((photo, idx) =>
              viewMode === 'grid' ? (
                <div key={photo._id} className="relative aspect-square bg-surface-2 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                  <img
                    src={`/uploads/${photo.filename}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    alt={photo.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-3 pointer-events-none">
                    <span className="text-fg text-sm font-bold truncate drop-shadow-lg">{photo.title}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                        <span key={tIdx} className="bg-surface-2 text-fg text-[10px] px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 z-20">
                    <button onClick={e => { e.stopPropagation(); setCommentPhoto(photo); }} className="w-8 h-8 bg-blue-600/80 rounded-full text-fg hover:bg-blue-600 flex items-center justify-center text-sm" title="Commenter">💬</button>
                    {!isViewer && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setEditingPhoto(photo); }} className="w-8 h-8 bg-surface-2 rounded-full text-fg hover:bg-line-strong flex items-center justify-center" title="Modifier">✎</button>
                        <button onClick={e => { e.stopPropagation(); setInfoPhoto(photo); }} className="w-8 h-8 bg-surface-2 rounded-full text-fg hover:bg-line-strong flex items-center justify-center font-bold text-xs" title="Info">i</button>
                        <button onClick={e => { e.stopPropagation(); handleShare(photo); }} className="w-8 h-8 bg-surface-2 rounded-full text-fg hover:bg-line-strong flex items-center justify-center" title="Partager">🔗</button>
                          <button onClick={e => { e.stopPropagation(); handleDeletePhoto(photo._id); }} className="w-8 h-8 bg-red-500/50 rounded-full text-fg hover:bg-red-500 flex items-center justify-center" title="Supprimer">✕</button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div key={photo._id} className="bg-surface border border-line rounded-xl p-3 flex items-center gap-4 hover:bg-surface transition group">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2 cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                    <img src={`/uploads/${photo.filename}`} alt="Thumb" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                    <h3 className="font-bold text-fg truncate">{photo.title}</h3>
                    <p className="text-xs text-muted truncate">{photo.description || 'Pas de description'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                        <span key={tIdx} className="text-purple-300 text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted w-24 text-right">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setCommentPhoto(photo)} className="text-accent hover:text-accent text-sm transition" title="Commenter">💬</button>
                    {!isViewer && (
                      <>
                        <button onClick={() => setEditingPhoto(photo)} className="text-muted hover:text-fg text-sm">Modif</button>
                          <button onClick={() => handleDeletePhoto(photo._id)} className="text-red-300 hover:text-red-100 text-sm">Suppr</button>
                      </>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Viewer public album vide non-virtuel */}
        {isViewer && !hasPhotos && (
          <div className="px-4 py-10 text-center">
            <p className="text-muted text-sm">Aucune photo disponible dans cet album.</p>
          </div>
        )}

        {/* MODALES */}
        {editingPhoto && <EditPhotoModal photo={editingPhoto} onClose={() => setEditingPhoto(null)} onSave={handleSavePhoto} />}
        {infoPhoto && <PhotoInfoModal photo={infoPhoto} onClose={() => setInfoPhoto(null)} />}
        {lightboxIndex !== null && <Lightbox photos={sortedPhotos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
        {commentPhoto && <CommentModal photo={commentPhoto} onClose={() => setCommentPhoto(null)} />}
        {showEmbedModal && id && <EmbedModal albumId={id} isPublic={album?.isPublic} onClose={() => setShowEmbedModal(false)} />}
      </div>
    </div>
  );
};

export default AlbumView;
