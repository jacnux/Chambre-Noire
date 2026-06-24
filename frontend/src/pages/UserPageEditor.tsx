// ===========================================
// luminaview
//         UserPageEditor
//
//     Juin 2026 v2.6.4
// résumé éditorial persistant + patch minimal
// ===========================================

import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';

type MenuGroup = 'none' | 'series' | 'exhibitions' | 'blog' | 'about';
type SectionType = 'text' | 'gallery' | 'split_text_gallery';

interface Album {
  _id: string;
  title: string;
  isVirtual?: boolean;
}

interface Photo {
  _id: string;
  filename: string;
  title?: string;
  createdAt?: string;
}

interface PageRef {
  _id: string;
  title: string;
  menuGroup?: MenuGroup;
}

interface PageSection {
  id: string;
  type: SectionType;
  content: string;
  albumIds: string[];
  ratio?: '30/70';
  summary?: boolean;
}

const SECTION_LABELS: Record<SectionType, string> = {
  text: 'Bloc Texte',
  gallery: 'Bloc Galerie',
  split_text_gallery: 'Bloc Mixte',
};

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  text: 'Introduction, note curatoriale, contexte ou cartel développé.',
  gallery: 'Séquence purement visuelle à partir d’un album.',
  split_text_gallery: 'Bloc éditorial 30/70 avec texte à gauche et galerie à droite.',
};

const emptySection = (type: SectionType): PageSection => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  content: '',
  albumIds: [],
  ratio: type === 'split_text_gallery' ? '30/70' : undefined,
  summary: false,
});

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const UserPageEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showOnBlog, setShowOnBlog] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverAlbumId, setCoverAlbumId] = useState('');
  const [coverPhotos, setCoverPhotos] = useState<Photo[]>([]);
  const [availableAlbums, setAvailableAlbums] = useState<Album[]>([]);
  const [availablePages, setAvailablePages] = useState<PageRef[]>([]);
  const [menuGroup, setMenuGroup] = useState<MenuGroup>('none');
  const [parentPageId, setParentPageId] = useState('');
  const [menuOrder, setMenuOrder] = useState(0);
  const [showInMenu, setShowInMenu] = useState(false);
  const [albumSortAZ, setAlbumSortAZ] = useState<'az' | 'za'>('az');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editorialSummary, setEditorialSummary] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPageData = async () => {
      try {
        const res = await api.get(`/user-pages/my/${id}`);
        const pageData = res.data;

        setTitle(pageData.title || '');
        setSlug(pageData.slug || '');
        setIsPublished(pageData.isPublished || false);
        setShowOnBlog(pageData.showOnBlog || false);
        setCoverImage(pageData.coverImage || '');
        setMenuGroup(pageData.menuGroup || 'none');
        setParentPageId(pageData.parentPageId?._id || pageData.parentPageId || '');
        setMenuOrder(pageData.menuOrder || 0);
        setShowInMenu(pageData.showInMenu || false);
        setEditorialSummary(pageData.editorialSummary || '');

        const formattedSections: PageSection[] = Array.isArray(pageData.sections)
          ? pageData.sections.map((s: any, index: number) => ({
              id: s._id || `section-${index}`,
              type: s.type,
              content: s.content || '',
              albumIds: Array.isArray(s.albumIds) ? s.albumIds.map((a: any) => a._id || a) : [],
              ratio: s.ratio || (s.type === 'split_text_gallery' ? '30/70' : undefined),
              summary: Boolean(s.summary),
            }))
          : [];

        setSections(formattedSections);
      } catch (err) {
        alert('Erreur chargement page');
        navigate('/dashboard/pages');
      }
    };

    fetchPageData();
  }, [id, navigate]);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get('/albums/my/albums');
        if (Array.isArray(res.data)) {
          setAvailableAlbums(res.data.filter((a: Album) => a.isVirtual === true));
        }
      } catch (err) {
        console.error('Erreur chargement albums', err);
      }
    };

    fetchAlbums();
  }, []);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get('/user-pages/my/list');
        if (Array.isArray(res.data)) setAvailablePages(res.data);
      } catch (err) {
        console.error('Erreur chargement pages', err);
      }
    };

    fetchPages();
  }, []);

  useEffect(() => {
    const fetchCoverPhotos = async () => {
      if (!coverAlbumId) {
        setCoverPhotos([]);
        return;
      }

      try {
        const res = await api.get(`/albums/photos/${coverAlbumId}`);
        setCoverPhotos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Erreur chargement photos cover', err);
        setCoverPhotos([]);
      }
    };

    fetchCoverPhotos();
  }, [coverAlbumId]);

  useEffect(() => {
    setCoverImage('');
  }, [coverAlbumId]);

  useEffect(() => {
    if (menuGroup === 'blog' && !showOnBlog) setShowOnBlog(true);
    if (menuGroup === 'none' || menuGroup === 'blog' || menuGroup === 'about') setParentPageId('');
  }, [menuGroup, showOnBlog]);

  const sortedAlbums = useMemo(() => {
    const copy = [...availableAlbums];
    return albumSortAZ === 'az'
      ? copy.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }))
      : copy.sort((a, b) => b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' }));
  }, [availableAlbums, albumSortAZ]);

  const eligibleParentPages = useMemo(() => {
    return availablePages
      .filter(page => page._id !== id)
      .filter(page => page.menuGroup === menuGroup)
      .sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
  }, [availablePages, id, menuGroup]);

  const pageKindLabel = menuGroup === 'exhibitions' ? 'exposition' : menuGroup === 'series' ? 'série' : 'page';
  const hasEditorialMode = menuGroup === 'series' || menuGroup === 'exhibitions';

  const visualSectionCount = useMemo(
    () => sections.filter(section => section.type === 'gallery' || section.type === 'split_text_gallery').length,
    [sections]
  );

  const addSection = (type: SectionType) => {
    setSections(prev => [...prev, emptySection(type)]);
  };

  const updateSection = (index: number, patch: Partial<PageSection>) => {
    setSections(prev => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  };

  const updateSectionContent = (index: number, field: keyof PageSection, value: any) => {
    setSections(prev => {
      const updated = [...prev];
      if (field === 'albumIds') {
        updated[index].albumIds = value ? [value] : [];
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setSections(prev => {
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
      return updated;
    });
  };

  const applyEditorialSummary = () => {
    const text = editorialSummary.trim();
    if (!text) return;

    setSections(prev => {
      const summaryIndex = prev.findIndex(section => section.type === 'text' && section.summary);
      if (summaryIndex >= 0) {
        return prev.map((section, index) =>
          index === summaryIndex ? { ...section, content: text, summary: true } : section
        );
      }

      return [{ ...emptySection('text'), content: text, summary: true }, ...prev];
    });
  };

  const insertEditorialSummary = () => {
    if (!editorialSummary.trim()) {
      setMessage('Le résumé éditorial est vide.');
      return;
    }

    if (sections.some(section => section.type === 'text' && section.summary)) {
      setMessage('Le résumé éditorial existe déjà dans cette page.');
      return;
    }

    setSections(prev => [{ ...emptySection('text'), content: editorialSummary.trim(), summary: true }, ...prev]);
  };

  const handleSave = async () => {
    if (!title || !slug) {
    setMessage("Le titre et l'URL sont obligatoires.");
      return;
    }

    const cleanedSections = sections.map(section => ({
      type: section.type,
      content: section.content,
      albumIds: section.albumIds,
      ratio: section.ratio,
      summary: Boolean(section.summary),
    }));

    if (hasEditorialMode) {
      const firstSection = cleanedSections[0];
      if (!firstSection || firstSection.type !== 'text') {
        setMessage(`Une ${pageKindLabel} doit commencer par un bloc texte d'introduction.`);
        return;
      }
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/user-pages/my/save', {
        id,
        title,
        slug,
        sections: cleanedSections,
        isPublished,
        showOnBlog,
        coverImage,
        menuGroup,
        parentPageId: parentPageId || null,
        menuOrder,
        showInMenu,
        editorialSummary: editorialSummary.trim(),
      });

      setMessage('Page sauvegardée !');
      setTimeout(() => navigate('/dashboard/pages'), 900);
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
    if (!slug || !id) setSlug(normalizeSlug(val));
  };

  const sortToggleBtn = (
    <div className="flex justify-end mb-2">
      <button
        type="button"
        onClick={() => setAlbumSortAZ(v => (v === 'az' ? 'za' : 'az'))}
        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1.5 rounded transition"
        title={albumSortAZ === 'az' ? 'Basculer Z→A' : 'Basculer A→Z'}
      >
        {albumSortAZ === 'az' ? 'A→Z' : 'Z→A'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-2">Pages éditoriales</div>
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 tracking-tight">
            {id ? 'Modifier la page' : 'Créer une page'}
          </h1>
          <p className="text-gray-400 mt-3 max-w-3xl">
            Structure la page comme une séquence éditoriale : introduction, ensembles visuels, puis blocs mixtes texte + galerie.
          </p>
        </div>

        {message && (
          <div className="bg-blue-600/90 border border-blue-400/30 p-3 rounded-xl mb-5 text-center text-sm md:text-base">
            {message}
          </div>
        )}

        <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl mb-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-gray-400 mb-1.5 text-sm">Titre</label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl"
                placeholder="Ex : Nature morte, fragments d'atelier"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1.5 text-sm">URL / slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(normalizeSlug(e.target.value))}
                className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl"
                placeholder="nature-morte-fragments-atelier"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1.5 text-sm">Section du menu</label>
                <select
                  value={menuGroup}
                  onChange={e => setMenuGroup(e.target.value as MenuGroup)}
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl"
                >
                  <option value="none">Aucune</option>
                  <option value="series">Séries</option>
                  <option value="exhibitions">Expositions</option>
                  <option value="blog">Blog</option>
                  <option value="about">À propos</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1.5 text-sm">Ordre d'affichage</label>
                <input
                  type="number"
                  min={0}
                  value={menuOrder}
                  onChange={e => setMenuOrder(Number(e.target.value || 0))}
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl"
                />
              </div>
            </div>

            {(menuGroup === 'series' || menuGroup === 'exhibitions') && (
              <div className="mt-4">
                <label className="block text-gray-400 mb-1.5 text-sm">Page parente optionnelle</label>
                <select
                  value={parentPageId}
                  onChange={e => setParentPageId(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-white/10 rounded-xl"
                >
                  <option value="">Aucune page parente</option>
                  {eligibleParentPages.map(page => (
                    <option key={page._id} value={page._id}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setShowInMenu(v => !v)}
                className={`flex-1 p-3 rounded-xl border transition font-semibold ${
                  showInMenu
                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-100'
                    : 'bg-gray-800 border-white/10 text-gray-400'
                }`}
              >
                {showInMenu ? 'Visible dans le menu' : 'Masqué du menu'}
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-semibold text-white">Résumé éditorial</h2>
              {hasEditorialMode && (
                <button
                  type="button"
                  onClick={applyEditorialSummary}
                  className="text-sm px-3 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                >
                  Appliquer au premier bloc
                </button>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-3">
              Pour une série ou une exposition, ce texte doit situer le travail et servir de premier paragraphe introductif.
            </p>

            <textarea
              value={editorialSummary}
              onChange={e => setEditorialSummary(e.target.value)}
              className="w-full min-h-[7rem] p-3 bg-gray-800 border border-white/10 rounded-xl"
              placeholder="Quelques lignes pour situer le travail dans son contexte éditorial, plastique ou documentaire..."
            />

            {hasEditorialMode && !sections.some(section => section.type === 'text' && section.summary) && (
              <button
                type="button"
                onClick={insertEditorialSummary}
                className="mt-3 text-sm px-3 py-2 rounded-lg border border-white/10 text-gray-200 hover:bg-white/5 transition"
              >
                Insérer comme premier bloc texte
              </button>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <label className="block text-gray-300 mb-1.5 font-semibold">Image de couverture / vignette</label>
            <p className="text-sm text-gray-500 mb-3">
              Choisis d'abord une galerie source, puis une image parmi les photos de cette galerie.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Galerie source</label>
                {sortToggleBtn}
                <select
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl"
                  value={coverAlbumId}
                  onChange={e => setCoverAlbumId(e.target.value)}
                >
                  <option value="">-- Choisir une galerie --</option>
                  {sortedAlbums.map(alb => (
                    <option key={alb._id} value={alb._id}>
                      {alb.title}
                    </option>
                  ))}
                </select>
              </div>

              {coverAlbumId && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Photo de couverture</label>
                  {coverPhotos.length > 0 ? (
                    <select
                      className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl"
                      value={coverImage}
                      onChange={e => setCoverImage(e.target.value)}
                    >
                      <option value="">-- Choisir une image --</option>
                      {coverPhotos.map(photo => (
                        <option key={photo._id} value={photo.filename}>
                          {photo.title || photo.filename}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Aucune photo disponible dans cette galerie.</p>
                  )}
                </div>
              )}

              {coverImage && (
                <div className="flex items-center gap-4 mt-2">
                  <img src={`/uploads/${coverImage}`} className="h-20 w-20 object-cover rounded-lg border border-white/10" alt="Aperçu" />
                  <button type="button" onClick={() => setCoverImage('')} className="text-sm text-red-400 hover:text-red-300">
                    Supprimer l'image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Visibilité</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setIsPublished(v => !v)}
                className={`flex-1 p-3 rounded-xl border transition font-semibold ${
                  isPublished
                    ? 'bg-green-700/20 border-green-500 text-green-100'
                    : 'bg-gray-800 border-white/10 text-gray-400'
                }`}
              >
                {isPublished ? 'Publié sur le portfolio' : 'Hors ligne portfolio'}
              </button>

              <button
                type="button"
                onClick={() => setShowOnBlog(v => !v)}
                className={`flex-1 p-3 rounded-xl border transition font-semibold ${
                  showOnBlog
                    ? 'bg-blue-700/20 border-blue-500 text-blue-100'
                    : 'bg-gray-800 border-white/10 text-gray-400'
                }`}
              >
                {showOnBlog ? 'Visible sur le blog' : 'Masqué du blog'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl mb-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Structure de page</h2>
              <p className="text-gray-400 mt-1 text-sm">
                {sections.length} bloc{sections.length > 1 ? 's' : ''} · {visualSectionCount} bloc{visualSectionCount > 1 ? 's' : ''} visuel{visualSectionCount > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => addSection('text')} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition">
                Texte
              </button>
              <button onClick={() => addSection('gallery')} className="px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition">
                Galerie
              </button>
              <button onClick={() => addSection('split_text_gallery')} className="px-4 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold transition">
                Mixte 30/70
              </button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-gray-500">
              Aucun bloc pour l'instant. Commence par un texte d'introduction, puis ajoute une galerie ou un bloc mixte.
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id || index} className="bg-black/30 p-5 rounded-2xl border border-white/10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-yellow-300 uppercase text-xs tracking-[0.24em]">
                          {SECTION_LABELS[section.type]}
                        </span>
                        <span className="text-xs text-gray-500">Bloc {index + 1}</span>
                        {section.summary && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-200">
                            Intro éditoriale
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{SECTION_DESCRIPTIONS[section.type]}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="px-3 py-2 rounded-lg bg-gray-800 text-sm text-gray-300 disabled:opacity-30"
                      >
                        Monter
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="px-3 py-2 rounded-lg bg-gray-800 text-sm text-gray-300 disabled:opacity-30"
                      >
                        Descendre
                      </button>
                      {section.type === 'text' && hasEditorialMode && (
                        <button
                          type="button"
                          onClick={() => updateSection(index, { summary: !section.summary })}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            section.summary ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {section.summary ? 'Résumé actif' : 'Définir comme résumé'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="px-3 py-2 rounded-lg bg-red-900/40 text-red-300 text-sm hover:bg-red-900/60"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {section.type === 'text' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Texte</label>
                      <textarea
                        className="w-full min-h-[10rem] bg-gray-800 border border-white/10 p-3 rounded-xl"
                        value={section.content}
                        onChange={e => updateSectionContent(index, 'content', e.target.value)}
                        placeholder="Texte libre en markdown ou texte simple..."
                      />
                    </div>
                  )}

                  {section.type === 'gallery' && (
                    <div className="flex flex-col gap-1">
                      <label className="block text-sm text-gray-400 mb-1">Album lié</label>
                      {sortToggleBtn}
                      <select
                        className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl"
                        onChange={e => updateSectionContent(index, 'albumIds', e.target.value)}
                        value={section.albumIds[0] || ''}
                      >
                        <option value="">-- Choisir un album --</option>
                        {sortedAlbums.map(alb => (
                          <option key={alb._id} value={alb._id}>
                            {alb.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {section.type === 'split_text_gallery' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="text-sm text-gray-300 font-medium">Bloc mixte</div>
                          <div className="text-xs text-gray-500">Ratio recommandé : 30 texte / 70 galerie.</div>
                        </div>
                        <div className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-200">
                          Ratio {section.ratio || '30/70'}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-[30%]">
                          <label className="block text-sm text-gray-400 mb-2">Texte</label>
                          <textarea
                            className="w-full min-h-[12rem] bg-gray-800 border border-white/10 p-3 rounded-xl text-sm"
                            value={section.content}
                            onChange={e => updateSectionContent(index, 'content', e.target.value)}
                            placeholder="Texte d'accompagnement, cartel, contexte, note de salle..."
                          />
                        </div>

                        <div className="w-full md:w-[70%]">
                          <label className="block text-sm text-gray-400 mb-2">Album lié</label>
                          {sortToggleBtn}
                          <select
                            className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl"
                            onChange={e => updateSectionContent(index, 'albumIds', e.target.value)}
                            value={section.albumIds[0] || ''}
                          >
                            <option value="">-- Sélectionner un album --</option>
                            {sortedAlbums.map(alb => (
                              <option key={alb._id} value={alb._id}>
                                {alb.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl font-bold text-lg disabled:opacity-60 transition"
        >
          {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};

export default UserPageEditor;
