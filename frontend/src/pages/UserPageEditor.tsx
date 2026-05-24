// ===========================================
// luminaview
//         UserPageEditor
//
//     Mai 2026 v2.3.2
// ===========================================

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';

const UserPageEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showOnBlog, setShowOnBlog] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<any[]>([]);
  const [availableAlbums, setAvailableAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Charger la page si édition
  useEffect(() => {
    if (!id) return;
    const fetchPageData = async () => {
      try {
        const res = await api.get(`/user-pages/my/${id}`);
        const pageData = res.data;
        setTitle(pageData.title);
        setSlug(pageData.slug);
        setIsPublished(pageData.isPublished || false);
        setShowOnBlog(pageData.showOnBlog || false);
        setCoverImage(pageData.coverImage || '');
        const formattedSections = pageData.sections.map((s: any) => ({
          ...s,
          albumIds: s.albumIds.map((a: any) => a._id || a),
        }));
        setSections(formattedSections);
      } catch (err) {
        alert('Erreur chargement page');
        navigate('/dashboard/pages');
      }
    };
    fetchPageData();
  }, [id, navigate]);

  // 2. Charger les albums virtuels
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get('/albums/my/albums');
        if (Array.isArray(res.data)) {
          const virtualAlbums = res.data.filter((a: any) => a.isVirtual === true);
          setAvailableAlbums(virtualAlbums);
        }
      } catch (err) {
        console.error('Erreur chargement albums', err);
      }
    };
    fetchAlbums();
  }, []);

  // 3. Charger les photos pour la cover
  const prevAlbumIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const fetchCoverPhotos = async () => {
      const sectionWithAlbum = sections.find(
        s =>
          (s.type === 'gallery' || s.type === 'split_text_gallery') &&
          s.albumIds &&
          s.albumIds.length > 0,
      );
      const currentAlbumId = sectionWithAlbum ? sectionWithAlbum.albumIds[0] : null;

      if (currentAlbumId && currentAlbumId !== prevAlbumIdRef.current) {
        try {
          const res = await api.get(`/albums/photos/${currentAlbumId}`);
          setCoverPhotos(res.data && res.data.length > 0 ? res.data : []);
        } catch (err) {
          console.error('Erreur chargement photos cover', err);
          setCoverPhotos([]);
        }
      }
      prevAlbumIdRef.current = currentAlbumId;
    };
    fetchCoverPhotos();
  }, [sections]);

  // Gestion sections
  const addSection = (type: 'text' | 'gallery' | 'split_text_gallery') => {
    setSections(prev => [...prev, { type, content: '', albumIds: [], _id: Date.now().toString() }]);
  };

  const updateSectionContent = (index: number, field: string, value: any) => {
    setSections(prev => {
      const updated = [...prev];
      if (field === 'albumIds') updated[index][field] = [value];
      else updated[index][field] = value;
      return updated;
    });
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  // Sauvegarde
  const handleSave = async () => {
    if (!title || !slug) {
      setMessage("Le titre et l'URL sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/user-pages/my/save', {
        id,
        title,
        slug,
        sections,
        isPublished,
        showOnBlog,
        coverImage,
      });
      setMessage('Page sauvegardée !');
      setTimeout(() => navigate('/dashboard/pages'), 1000);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug && !id) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">
          {id ? 'Modifier la Page' : 'Créer une Page'}
        </h1>

        {message && (
          <div className="bg-blue-600 p-3 rounded mb-4 text-center">{message}</div>
        )}

        {/* Infos Principales */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="mb-4">
            <label className="block text-gray-400 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full p-3 bg-gray-700 rounded"
              placeholder="Ex: Mes Tarifs"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-400 mb-1">URL (Slug)</label>
            <input
              type="text"
              value={slug}
              onChange={e =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              className="w-full p-3 bg-gray-700 rounded"
              placeholder="mes-tarifs"
            />
          </div>

          {/* Image de couverture */}
          <div className="mb-4 border-t border-gray-700 pt-4">
            <label className="block text-gray-400 mb-1 font-bold">
              Image de couverture (Vignette)
            </label>
            {coverPhotos.length > 0 ? (
              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-700 p-3 rounded"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                >
                  <option value="">-- Choisir une image de l'album --</option>
                  {coverPhotos.map((photo: any) => (
                    <option key={photo._id} value={photo.filename}>
                      {photo.title || photo.filename}
                    </option>
                  ))}
                </select>
                {coverImage && (
                  <div className="flex items-center gap-4 mt-2">
                    <img
                      src={`/uploads/${coverImage}`}
                      className="h-20 w-20 object-cover rounded border border-gray-600"
                      alt="Aperçu"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer l'image
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                Ajoutez une section "Galerie" et sélectionnez un album pour pouvoir choisir une
                image.
              </p>
            )}
          </div>

          {/* Visibilité */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-bold text-white mb-3">Visibilité</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setIsPublished(v => !v)}
                className={`flex-1 p-3 rounded-lg border-2 transition font-bold ${
                  isPublished
                    ? 'bg-green-800 border-green-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}
              >
                {isPublished ? '✓ Publié sur le Portfolio' : '✕ Hors-ligne (Portfolio)'}
              </button>
              <button
                type="button"
                onClick={() => setShowOnBlog(v => !v)}
                className={`flex-1 p-3 rounded-lg border-2 transition font-bold ${
                  showOnBlog
                    ? 'bg-blue-800 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}
              >
                {showOnBlog ? '✓ Visible sur le Blog' : '✕ Masqué du Blog'}
              </button>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <div
            key={section._id || index}
            className="bg-gray-800 p-5 rounded-lg mb-4 border-l-4 border-yellow-500"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-yellow-400 uppercase text-sm">
                {section.type === 'text'
                  ? 'Bloc Texte'
                  : section.type === 'gallery'
                  ? 'Bloc Galerie'
                  : 'Bloc Mixte'}
              </span>
              <button
                onClick={() => removeSection(index)}
                className="text-red-500 text-sm hover:text-red-400"
              >
                Supprimer
              </button>
            </div>

            {section.type === 'text' && (
              <textarea
                className="w-full h-32 bg-gray-700 p-3 rounded"
                value={section.content || ''}
                onChange={e => updateSectionContent(index, 'content', e.target.value)}
              />
            )}

            {section.type === 'gallery' && (
              <select
                className="w-full bg-gray-700 p-3 rounded"
                onChange={e => updateSectionContent(index, 'albumIds', e.target.value)}
                value={section.albumIds[0] || ''}
              >
                <option value="">-- Choisir un album --</option>
                {availableAlbums.map(alb => (
                  <option key={alb._id} value={alb._id}>
                    {alb.title}
                  </option>
                ))}
              </select>
            )}

            {section.type === 'split_text_gallery' && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[30%]">
                  <textarea
                    className="w-full h-40 bg-gray-700 p-3 rounded text-sm mt-1"
                    value={section.content || ''}
                    onChange={e => updateSectionContent(index, 'content', e.target.value)}
                  />
                </div>
                <div className="w-full md:w-[70%]">
                  <select
                    className="w-full bg-gray-700 p-3 rounded mt-1"
                    onChange={e => updateSectionContent(index, 'albumIds', e.target.value)}
                    value={section.albumIds[0] || ''}
                  >
                    <option value="">-- Sélectionner --</option>
                    {availableAlbums.map(alb => (
                      <option key={alb._id} value={alb._id}>
                        {alb.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Boutons Ajouter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => addSection('text')}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
          >
            + Texte
          </button>
          <button
            onClick={() => addSection('gallery')}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded font-bold transition"
          >
            + Galerie
          </button>
          <button
            onClick={() => addSection('split_text_gallery')}
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded font-bold transition"
          >
            + Mixte
          </button>
        </div>

        {/* Sauvegarde */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 rounded font-bold text-lg disabled:opacity-60 transition"
        >
          {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};

export default UserPageEditor;
