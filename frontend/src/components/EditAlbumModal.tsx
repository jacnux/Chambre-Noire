import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface EditAlbumModalProps {
  album: any;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
}

const EditAlbumModal: React.FC<EditAlbumModalProps> = ({ album, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Gestion des photos (pour la couverture)
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // 1. Charger les données initiales
  useEffect(() => {
    if (album) {
      setTitle(album.title || '');
      setDescription(album.description || '');
      setCoverImage(album.coverImage || '');
    }
  }, [album]);

  // 2. Charger les photos (pour choix couverture)
  useEffect(() => {
    if (album) {
      setLoadingPhotos(true);
      api.get(`/albums/photos/${album._id}`)
        .then(res => setPhotos(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoadingPhotos(false));
    }
  }, [album]);

  // 3. Soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(album._id, {
      title,
      description,
      coverImage
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-white font-bold text-xl">✕</button>

        <h3 className="text-xl font-bold mb-6 text-white drop-shadow-lg">
          Modifier l'Album
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
            <input
              type="text"
              className="w-full bg-white/20 border border-white/30 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              className="w-full bg-white/20 border border-white/30 text-white rounded-lg px-4 py-3 focus:outline-none h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photo de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Photo de couverture
            </label>
            {loadingPhotos ? (
              <p className="text-gray-400 text-sm">Chargement des photos...</p>
            ) : (
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 bg-black/20 rounded-lg">
                {photos.map((p: any) => (
                  <div
                    key={p._id}
                    onClick={() => setCoverImage(p.filename)}
                    className={`cursor-pointer rounded overflow-hidden border-2 transition ${coverImage === p.filename ? 'border-yellow-400 scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={`/uploads/${p.filename}`} alt="Thumb" className="w-full h-12 object-cover" />
                  </div>
                ))}
              </div>
            )}
            {coverImage && <p className="text-xs text-gray-500 mt-1">Sélectionnée : {coverImage}</p>}
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-full transition font-medium border border-white/10"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-full font-bold shadow-lg transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAlbumModal;
