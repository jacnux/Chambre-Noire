import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const Tools = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [targetAlbum, setTargetAlbum] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterAlbum, setFilterAlbum] = useState('');

  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [albumsRes, photosRes] = await Promise.all([
        api.get('/albums/my/albums'),
        api.get('/photos/my/photos')
      ]);
      setAlbums(albumsRes.data.filter((a: any) => !a.isVirtual));
      setPhotos(photosRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMove = async () => {
    if (!selectedPhoto || !targetAlbum) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une photo et un album.' });
      return;
    }
    try {
      await api.put(`/photos/move/${selectedPhoto}`, { targetAlbumId: targetAlbum });
      setMessage({ type: 'success', text: 'Photo déplacée avec succès !' });
      setSelectedPhoto('');
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du déplacement.' });
    }
  };

  const filteredPhotos = photos
    .filter(p => {
      const matchText = searchText === '' || p.title?.toLowerCase().startsWith(searchText.toLowerCase());
      const matchAlbum = filterAlbum === '' || p.albumId === filterAlbum;
      return matchText && matchAlbum;
    })
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }));

  const grouped = filteredPhotos.reduce((acc: Record<string, any[]>, photo) => {
    const letter = (photo.title?.[0] || '#').toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(photo);
    return acc;
  }, {});

  const selectedPhotoData = photos.find(p => p._id === selectedPhoto);

  const shellTextClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const panelClass = theme === 'dark'
    ? 'bg-gray-800/60 border border-white/10 backdrop-blur-xl'
    : 'bg-white/90 border border-gray-200 shadow-sm';
  const inputClass = theme === 'dark'
    ? 'bg-black/30 border border-white/20 text-white placeholder-gray-500'
    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400';
  const previewClass = theme === 'dark' ? 'bg-black/20' : 'bg-gray-100';

  return (
    <div className={`w-full px-4 py-6 sm:px-6 sm:py-8 ${shellTextClass}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold">Outils & Maintenance</h1>
          <Link
            to="/dashboard"
            className={`transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            ← Retour Dashboard
          </Link>
        </div>

        <div className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className="text-lg font-semibold mb-4">Déplacer une photo</h2>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Rechercher par titre (ex: Po...)"
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setSelectedPhoto(''); }}
              className={`flex-1 p-3 rounded-lg ${inputClass}`}
            />
            <select
              value={filterAlbum}
              onChange={e => { setFilterAlbum(e.target.value); setSelectedPhoto(''); }}
              className={`flex-1 p-3 rounded-lg ${inputClass}`}
            >
              <option value="">— Tous les albums —</option>
              {albums.map(a => (
                <option key={a._id} value={a._id}>{a.title}</option>
              ))}
            </select>
          </div>

          <p className={`text-sm mb-3 ${mutedTextClass}`}>
            {filteredPhotos.length} photo{filteredPhotos.length > 1 ? 's' : ''} trouvée{filteredPhotos.length > 1 ? 's' : ''}
          </p>

          <label className={`block text-sm mb-1 ${mutedTextClass}`}>1. Sélectionner la photo</label>
          <select
            value={selectedPhoto}
            onChange={e => setSelectedPhoto(e.target.value)}
            className={`w-full p-3 rounded-lg mb-4 ${inputClass}`}
            size={8}
          >
            <option value="">-- Choisir une photo --</option>
            {Object.keys(grouped).sort().map(letter => (
              <optgroup key={letter} label={`— ${letter} —`}>
                {grouped[letter].map(p => {
                  const parentAlbum = albums.find(a => a._id === p.albumId);
                  return (
                    <option key={p._id} value={p._id}>
                      {p.title} ({parentAlbum?.title || 'Inconnu'})
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>

          {selectedPhotoData && (
            <div className={`flex items-center gap-4 p-3 rounded-lg mb-4 ${previewClass}`}>
              <img
                src={`/uploads/${selectedPhotoData.filename}`}
                className="w-16 h-16 object-cover rounded"
                alt={selectedPhotoData.title}
              />
              <div>
                <p className="font-medium">{selectedPhotoData.title}</p>
                <p className={`text-sm ${mutedTextClass}`}>{selectedPhotoData.tags?.join(', ')}</p>
              </div>
            </div>
          )}

          <label className={`block text-sm mb-1 ${mutedTextClass}`}>2. Album de destination</label>
          <select
            value={targetAlbum}
            onChange={e => setTargetAlbum(e.target.value)}
            className={`w-full p-3 rounded-lg mb-4 ${inputClass}`}
          >
            <option value="">-- Choisir un album --</option>
            {albums.map(a => (
              <option key={a._id} value={a._id}>{a.title}</option>
            ))}
          </select>

          <button
            onClick={handleMove}
            disabled={!selectedPhoto || !targetAlbum}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            Déplacer la photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tools;
