// 24 Février 2026 - Version 8.0 (Merge V6 UI + V8 Routing + Sorting + Tags + Watermark)
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

import Lightbox from '../components/Lightbox';
import EditPhotoModal from '../components/EditPhotoModal';
import PhotoInfoModal from '../components/PhotoInfoModal';


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

const AlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [album, setAlbum]               = useState<any>(null);
  const [photos, setPhotos]             = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [infoPhoto, setInfoPhoto]       = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);


  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<'date_desc' | 'date_asc' | 'index'>('date_desc');

  const isViewer    = searchParams.get('mode') === 'viewer';
  const isSlideshow = searchParams.get('mode') === 'slideshow';

  useEffect(() => {
    if (!id) return;
    api.get(`/albums/${id}`).then(res => setAlbum(res.data)).catch(console.error);
    api.get(`/albums/photos/${id}`).then(res => {
      console.log("DONNÉES PHOTOS RECUES :", res.data);
      setPhotos(res.data);
    }).catch(console.error);
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
          if (progressEvent.total)
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
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

  if (isSlideshow && photos.length > 0)
    return <>{navigate(`/album/${id}?mode=viewer`)}</>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        {!isViewer && <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm transition">← Retour</Link>}
        <span className="font-bold text-yellow-400 flex-1">Hélioscope</span>
        <span className="text-sm text-gray-300">
          Album : {album ? album.title : 'Chargement...'}
          {isViewer && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Public</span>}
        </span>
        {!isViewer && (
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition">
            + Ajouter
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        )}
        {/* Switch grille / liste */}
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition ${viewMode === 'grid' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5z"/></svg>
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition ${viewMode === 'list' ? 'bg-white/30 text-white' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>
          </button>
        </div>
        {/* Boutons de tri */}
        {!isViewer && (
          <div className="flex gap-1">
            <button onClick={() => setSortMode('date_desc')} className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'date_desc' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`} title="Plus récents">⬇️</button>
            <button onClick={() => setSortMode('date_asc')}  className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'date_asc'  ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`} title="Plus anciens">⬆️</button>
            <button onClick={() => setSortMode('index')}     className={`p-2 rounded-full transition text-xs font-bold ${sortMode === 'index'     ? 'bg-blue-500 text-white'  : 'text-gray-400 hover:text-white'}`} title="Ordre Manuel">#</button>
          </div>
        )}
      </header>

      {/* Zone Upload */}
      {!isViewer && pendingFiles.length > 0 && (
        <form onSubmit={handleUpload} className="p-4 bg-gray-800 border-b border-white/10">
          <p className="font-bold text-white mb-3">Photos à envoyer ({pendingFiles.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {pendingFiles.map((pf, idx) => (
              <div key={idx} className="relative bg-gray-700 rounded-lg overflow-hidden p-2 space-y-1">
                <img src={pf.previewUrl} className="w-full h-24 object-cover rounded" alt="" />
                <button type="button" onClick={() => handleSetCover(idx)}
                  className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-sm shadow transition ${pf.isCover ? 'bg-yellow-400 text-black scale-110' : 'bg-white/20 text-white hover:bg-white/40'}`}
                  title="Définir couverture">★</button>
                <input type="number" value={pf.index} onChange={e => { const n=[...pendingFiles]; n[idx].index=parseInt(e.target.value); setPendingFiles(n); }}
                  className="bg-white/10 border border-white/20 p-1 w-12 text-center text-sm text-white rounded" />
                <input type="text" value={pf.title} placeholder="Titre" onChange={e => { const n=[...pendingFiles]; n[idx].title=e.target.value; setPendingFiles(n); }}
                  className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                <input type="text" value={pf.tag} placeholder="Tags (virgule)" onChange={e => { const n=[...pendingFiles]; n[idx].tag=e.target.value; setPendingFiles(n); }}
                  className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                <input type="text" value={pf.description} placeholder="Description" onChange={e => { const n=[...pendingFiles]; n[idx].description=e.target.value; setPendingFiles(n); }}
                  className="bg-white/10 border border-white/20 p-2 w-full text-sm text-white rounded placeholder-gray-400" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={pf.applyWatermark} onChange={e => { const n=[...pendingFiles]; n[idx].applyWatermark = e.target.checked; setPendingFiles(n); }} className="w-4 h-4 rounded" />
                  <span className="text-xs text-gray-300">Filigrane</span>
                </div>
                {pf.applyWatermark && (
                  <input type="text" value={pf.watermarkText} placeholder="Texte filigrane" onChange={e => { const n=[...pendingFiles]; n[idx].watermarkText = e.target.value; setPendingFiles(n); }}
                    className="w-full bg-black/30 text-white text-xs p-2 rounded border border-white/10" />
                )}
                <button type="button" onClick={() => removePendingFile(idx)} className="text-red-300 hover:text-red-100 font-bold text-2xl px-2">×</button>
              </div>
            ))}
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition">
            Valider l'envoi
          </button>
        </form>
      )}

      {/* Conteneur Photos */}
      <main className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}`}>
        {sortedPhotos.map((photo, idx) =>
          viewMode === 'grid' ? (
            // === VUE GRILLE ===
            <div key={photo._id} className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-800 shadow-lg"
                 onClick={() => setLightboxIndex(idx)}>
              <img src={`/uploads/${photo.filename}`} alt={photo.title}
                className="w-full aspect-square object-cover transition duration-300 group-hover:scale-105" />
              {/* Titre + tags */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                    <span key={tIdx} className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
              {/* Boutons overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
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
            // === VUE LISTE ===
            <div key={photo._id} className="flex items-center gap-4 bg-gray-800 rounded-xl p-3 cursor-pointer hover:bg-gray-700 transition"
                 onClick={() => setLightboxIndex(idx)}>
              <img src={`/uploads/${photo.filename}`} alt={photo.title}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{photo.title}</p>
                <p className="text-gray-400 text-sm truncate">{photo.description || "Pas de description"}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(photo.tags) && photo.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                    <span key={tIdx} className="text-xs bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-1">{new Date(photo.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {!isViewer && (
                  <>
                    <button onClick={() => setEditingPhoto(photo)} className="text-indigo-300 hover:text-indigo-100 text-sm">Modif</button>
                    <button onClick={() => handleDeletePhoto(photo._id)} className="text-red-300 hover:text-red-100 text-sm">Suppr</button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </main>

      {/* Modales */}
      {editingPhoto && <EditPhotoModal photo={editingPhoto} onClose={() => setEditingPhoto(null)} onSave={handleSavePhoto} />}
      {infoPhoto    && <PhotoInfoModal photo={infoPhoto}    onClose={() => setInfoPhoto(null)} />}

      {lightboxIndex !== null && (
        <Lightbox photos={sortedPhotos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}


    </div>
  );
};

export default AlbumView;
