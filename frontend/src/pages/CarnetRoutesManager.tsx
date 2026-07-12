import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EditPhotoModal from '../components/EditPhotoModal';

const parseDevTime = (timeStr: string) => {
  let min = 0;
  let sec = 0;
  if (timeStr) {
    const minMatch = timeStr.match(/(\d+)\s*(m|min|mn)/i);
    const secMatch = timeStr.match(/(\d+)\s*(s|sec)/i);
    if (minMatch) min = parseInt(minMatch[1], 10);
    if (secMatch) sec = parseInt(secMatch[1], 10);
    if (!minMatch && !secMatch && /^\d+$/.test(timeStr.trim())) {
      min = parseInt(timeStr.trim(), 10);
    }
  }
  return { min, sec };
};

type TabType = 'projects' | 'photos' | 'gear' | 'films';

const CarnetRoutesManager: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Listes ---
  const [projects, setProjects] = useState<any[]>([]);
  const [gear, setGear] = useState<any[]>([]);
  const [films, setFilms] = useState<any[]>([]);
  const [myPhotos, setMyPhotos] = useState<any[]>([]); // Toutes les photos de l'utilisateur pour association
  const [userAlbums, setUserAlbums] = useState<any[]>([]);

  // --- Modals et Formulaires ---
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddGear, setShowAddGear] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [selectedFilmRoll, setSelectedFilmRoll] = useState<any | null>(null); // Pour afficher la planche-contact
  const [showPhotoPickerForSlot, setShowPhotoPickerForSlot] = useState<number | null>(null); // Slot en attente d'association
  const [shareItem, setShareItem] = useState<{ type: 'project' | 'photo'; title: string; url: string; htmlCode: string } | null>(null);
  const [pickerTab, setPickerTab] = useState<'gallery' | 'upload'>('gallery');
  const [selectedUploadAlbumId, setSelectedUploadAlbumId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- Form States ---
  // Projet
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPublished, setProjectPublished] = useState(false);
  const [projectCover, setProjectCover] = useState('');
  const [projectMakingOf, setProjectMakingOf] = useState('');
  const [projectMakingOfPreview, setProjectMakingOfPreview] = useState(false);
  const [projectMakingOfUploading, setProjectMakingOfUploading] = useState(false);

  // Matériel
  const [gearType, setGearType] = useState<'camera' | 'lens'>('camera');
  const [gearBrand, setGearBrand] = useState('');
  const [gearModel, setGearModel] = useState('');
  const [gearFormat, setGearFormat] = useState('35mm');
  const [gearSerial, setGearSerial] = useState('');
  const [gearNotes, setGearNotes] = useState('');

  // Pellicule
  const [filmName, setFilmName] = useState('');
  const [filmBrand, setFilmBrand] = useState('');
  const [filmType, setFilmType] = useState('');
  const [filmIso, setFilmIso] = useState<number>(400);
  const [filmFormat, setFilmFormat] = useState<string>('135');
  const [filmMaxViews, setFilmMaxViews] = useState<number>(36);
  const [filmTypeColor, setFilmTypeColor] = useState<'BW' | 'color' | 'slide'>('BW');
  const [filmGearCameraId, setFilmGearCameraId] = useState('');
  const [filmGearLensId, setFilmGearLensId] = useState('');
  const [filmDefaultSpeed, setFilmDefaultSpeed] = useState('');
  const [filmDefaultAperture, setFilmDefaultAperture] = useState('');
  const [filmDefaultFilter, setFilmDefaultFilter] = useState('Aucun');
  const [filmDefaultNdFilter, setFilmDefaultNdFilter] = useState('Aucun');
  const [filmDefaultLensHood, setFilmDefaultLensHood] = useState(false);
  const [filmNotes, setFilmNotes] = useState('');

  // Rechercher/Filtrer dans le picker de photo
  const [pickerSearch, setPickerSearch] = useState('');
  const [searchPhotoQuery, setSearchPhotoQuery] = useState('');
  const [searchFilmQuery, setSearchFilmQuery] = useState('');
  const [filterByCameraTag, setFilterByCameraTag] = useState(false);

  // Pellicule - Développement
  const [devDeveloper, setDevDeveloper] = useState('');
  const [devDilution, setDevDilution] = useState('');
  const [devTimeMin, setDevTimeMin] = useState(0);
  const [devTimeSec, setDevTimeSec] = useState(0);
  const [devTemperature, setDevTemperature] = useState('');
  const [devAgitation, setDevAgitation] = useState('');
  const [devPushPull, setDevPushPull] = useState('');
  const [filmIsoUsed, setFilmIsoUsed] = useState('');
  const [devFixerBrand, setDevFixerBrand] = useState('');
  const [devFixerDilution, setDevFixerDilution] = useState('1+4');
  const [devFixerTime, setDevFixerTime] = useState('5mn');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, gearRes, filmRes, photosRes, albumsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/gear'),
        api.get('/films'),
        api.get('/photos/my/photos'),
        api.get('/albums/my/albums')
      ]);
      setProjects(projRes.data);
      setGear(gearRes.data);
      setFilms(filmRes.data);
      setMyPhotos(photosRes.data);
      setUserAlbums(albumsRes.data);
      if (albumsRes.data.length > 0 && !selectedUploadAlbumId) {
        setSelectedUploadAlbumId(albumsRes.data[0]._id);
      }

      // Si on visualise une planche-contact, rafraîchir son objet
      if (selectedFilmRoll) {
        const updatedRoll = filmRes.data.find((f: any) => f._id === selectedFilmRoll._id);
        setSelectedFilmRoll(updatedRoll || null);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données du carnet de route.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ajustement auto du maxViews en fonction du format
  useEffect(() => {
    if (filmFormat === 'plan-film') {
      setFilmMaxViews(1);
    } else if (filmFormat === '120') {
      setFilmMaxViews(12);
    } else if (filmFormat === '135') {
      setFilmMaxViews(36);
    }
  }, [filmFormat]);

  // --- Actions CRUD Projets ---
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return alert('Le nom du projet est requis');

    try {
      const payload = {
        name: projectName,
        description: projectDesc,
        isPublished: projectPublished,
        coverImage: projectCover,
        makingOf: projectMakingOf
      };

      if (editingItem) {
        await api.put(`/projects/${editingItem._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde du projet');
    }
  };

  const handleEditProject = (project: any) => {
    setEditingItem(project);
    setProjectName(project.name);
    setProjectDesc(project.description || '');
    setProjectPublished(project.isPublished || false);
    setProjectCover(project.coverImage || '');
    setProjectMakingOf(project.makingOf || '');
    setShowAddProject(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Supprimer ce projet ? Les photos associées ne seront pas supprimées mais seront détachées du projet.')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // --- Actions CRUD Matériel ---
  const handleSaveGear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gearBrand || !gearModel || !gearFormat) return alert('Veuillez remplir tous les champs obligatoires');

    try {
      const payload = {
        type: gearType,
        brand: gearBrand,
        model: gearModel,
        format: gearFormat,
        serialNumber: gearSerial,
        notes: gearNotes
      };

      if (editingItem) {
        await api.put(`/gear/${editingItem._id}`, payload);
      } else {
        await api.post('/gear', payload);
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde du matériel');
    }
  };

  const handleEditGear = (g: any) => {
    setEditingItem(g);
    setGearType(g.type);
    setGearBrand(g.brand);
    setGearModel(g.model);
    setGearFormat(g.format);
    setGearSerial(g.serialNumber || '');
    setGearNotes(g.notes || '');
    setShowAddGear(true);
  };

  const handleDeleteGear = async (id: string) => {
    if (!window.confirm('Supprimer ce matériel de votre inventaire ?')) return;
    try {
      await api.delete(`/gear/${id}`);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // --- Actions CRUD Pellicules ---
  const handleSaveFilm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmName || !filmBrand || !filmType || !filmIso) {
      return alert('Veuillez remplir les champs obligatoires');
    }

    try {
      const payload = {
        name: filmName,
        brand: filmBrand,
        filmType: filmType,
        iso: Number(filmIso),
        isoUsed: filmIsoUsed ? Number(filmIsoUsed) : null,
        format: filmFormat,
        maxViews: Number(filmMaxViews),
        type: filmTypeColor,
        gearCameraId: filmGearCameraId || null,
        gearLensId: filmGearLensId || null,
        defaultExposureSettings: {
          aperture: filmDefaultAperture || '',
          shutterSpeed: filmDefaultSpeed || '',
          filter: filmDefaultFilter || 'Aucun',
          ndFilter: filmDefaultNdFilter || 'Aucun',
          lensHood: filmDefaultLensHood
        },
        developmentSettings: {
          developer: devDeveloper,
          dilution: devDilution,
          time: devTimeMin || devTimeSec ? `${devTimeMin}mn ${devTimeSec}s` : '',
          temperature: devTemperature,
          agitation: devAgitation,
          pushPull: devPushPull,
          fixerBrand: devFixerBrand,
          fixerDilution: devFixerDilution,
          fixerTime: devFixerTime
        },
        notes: filmNotes
      };

      if (editingItem) {
        await api.put(`/films/${editingItem._id}`, payload);
      } else {
        await api.post('/films', payload);
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde de la pellicule');
    }
  };

  const handleEditFilm = (f: any) => {
    setEditingItem(f);
    setFilmName(f.name);
    setFilmBrand(f.brand);
    setFilmType(f.filmType);
    setFilmIso(f.iso);
    setFilmIsoUsed(f.isoUsed || '');
    setFilmFormat(f.format);
    setFilmMaxViews(f.maxViews);
    setFilmTypeColor(f.type);
    setFilmGearCameraId(f.gearCameraId?._id || f.gearCameraId || '');
    setFilmGearLensId(f.gearLensId?._id || f.gearLensId || '');
    setFilmDefaultAperture(f.defaultExposureSettings?.aperture || '');
    setFilmDefaultSpeed(f.defaultExposureSettings?.shutterSpeed || '');
    setFilmDefaultFilter(f.defaultExposureSettings?.filter || 'Aucun');
    setFilmDefaultNdFilter(f.defaultExposureSettings?.ndFilter || 'Aucun');
    setFilmDefaultLensHood(f.defaultExposureSettings?.lensHood || false);
    setFilmNotes(f.notes || '');

    setDevDeveloper(f.developmentSettings?.developer || '');
    setDevDilution(f.developmentSettings?.dilution || '');
    const parsedTime = parseDevTime(f.developmentSettings?.time || '');
    setDevTimeMin(parsedTime.min);
    setDevTimeSec(parsedTime.sec);
    setDevTemperature(f.developmentSettings?.temperature || '');
    setDevAgitation(f.developmentSettings?.agitation || '');
    setDevPushPull(f.developmentSettings?.pushPull || '');
    setDevFixerBrand(f.developmentSettings?.fixerBrand || '');
    setDevFixerDilution(f.developmentSettings?.fixerDilution || '1+4');
    setDevFixerTime(f.developmentSettings?.fixerTime || '5mn');

    setShowAddFilm(true);
  };

  const handleDeleteFilm = async (id: string) => {
    if (!window.confirm('Supprimer ce rouleau de pellicule ? Les photos liées ne seront pas supprimées mais détachées de ce rouleau.')) return;
    try {
      await api.delete(`/films/${id}`);
      fetchData();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleDuplicateFilm = async (film: any) => {
    const newName = window.prompt("Nom de la copie de la pellicule / châssis :", `${film.name} (Copie)`);
    if (!newName || !newName.trim()) return;
    try {
      await api.post('/films', {
        name: newName.trim(),
        brand: film.brand,
        filmType: film.filmType,
        iso: film.iso,
        isoUsed: film.isoUsed,
        format: film.format,
        maxViews: film.maxViews,
        type: film.type,
        gearCameraId: film.gearCameraId?._id || film.gearCameraId || null,
        gearLensId: film.gearLensId?._id || film.gearLensId || null,
        defaultExposureSettings: film.defaultExposureSettings,
        developmentSettings: film.developmentSettings,
        notes: film.notes
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la duplication de la pellicule.");
    }
  };

  // --- Gestion Planche-Contact ---
  const handleDirectUploadToSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilmRoll || showPhotoPickerForSlot === null || !selectedUploadAlbumId || !uploadFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photos', uploadFile);
    formData.append('albumId', selectedUploadAlbumId);
    
    const meta = [{
      index: 0,
      title: uploadFile.name.split('.').slice(0, -1).join('.') || 'Sans titre',
      description: `Importé via la pellicule ${selectedFilmRoll.name}`,
      isCover: false,
      originalName: uploadFile.name,
      tag: '',
      applyWatermark: false,
      watermarkText: '',
      filmId: selectedFilmRoll._id,
      filmFrameNumber: showPhotoPickerForSlot,
      isAnalog: true
    }];
    formData.append('metadata', JSON.stringify(meta));

    try {
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadFile(null);
      setShowPhotoPickerForSlot(null);
      setPickerTab('gallery');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Erreur lors du téléversement : ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleLinkPhotoToSlot = async (photoId: string) => {
    if (!selectedFilmRoll || showPhotoPickerForSlot === null) return;
    try {
      await api.put(`/photos/${photoId}`, {
        filmId: selectedFilmRoll._id,
        filmFrameNumber: showPhotoPickerForSlot,
        isAnalog: true
      });
      setShowPhotoPickerForSlot(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur d'association de la photo.");
    }
  };

  const handleUnlinkPhotoFromSlot = async (photoId: string) => {
    if (!window.confirm('Détacher cette photo de la vue ?')) return;
    try {
      await api.put(`/photos/${photoId}`, {
        filmId: null,
        filmFrameNumber: null
      });
      fetchData();
    } catch (err) {
      alert('Erreur de modification.');
    }
  };

  const handleToggleProjectPublish = async (project: any) => {
    try {
      await api.put(`/projects/${project._id}`, { isPublished: !project.isPublished });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la mise à jour du projet.");
    }
  };

  const handleTogglePhotoShowOnBlog = async (photo: any) => {
    try {
      await api.put(`/photos/${photo._id}`, { showOnBlog: !photo.showOnBlog });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la mise à jour du statut de la photo.");
    }
  };

  const handleSavePhoto = async (updatedData: any) => {
    if (!editingPhoto) return;
    try {
      await api.put(`/photos/${editingPhoto._id}`, updatedData);
      setEditingPhoto(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la sauvegarde de la photo.");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Supprimer définitivement cette photo ?")) return;
    try {
      await api.delete(`/photos/${photoId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Erreur lors de la suppression de la photo.");
    }
  };

  const getProjectPublicUrl = (project: any) => {
    return `/project/${project.slug}`;
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowAddProject(false);
    setShowAddGear(false);
    setShowAddFilm(false);

    setProjectName('');
    setProjectDesc('');
    setProjectPublished(false);
    setProjectCover('');
    setProjectMakingOf('');
    setProjectMakingOfPreview(false);
    setProjectMakingOfUploading(false);

    setGearBrand('');
    setGearModel('');
    setGearFormat('35mm');
    setGearSerial('');
    setGearNotes('');

    setFilmName('');
    setFilmBrand('');
    setFilmType('');
    setFilmIso(400);
    setFilmFormat('135');
    setFilmMaxViews(36);
    setFilmTypeColor('BW');
    setFilmGearCameraId('');
    setFilmGearLensId('');
    setFilmDefaultSpeed('');
    setFilmDefaultAperture('');
    setFilmDefaultFilter('Aucun');
    setFilmDefaultNdFilter('Aucun');
    setFilmDefaultLensHood(false);
    setFilmNotes('');

    setFilmIsoUsed('');
    setDevDeveloper('');
    setDevDilution('');
    setDevTimeMin(0);
    setDevTimeSec(0);
    setDevTemperature('');
    setDevAgitation('');
    setDevPushPull('');
    setDevFixerBrand('');
    setDevFixerDilution('1+4');
    setDevFixerTime('5mn');
  };

  return (
    <div className="space-y-8 px-4 py-8 sm:px-8 sm:py-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-5 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Chambre Noire & Carnet
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gérez vos boîtiers, vos rouleaux de film (châssis) et vos projets de prise de vue.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { setActiveTab('projects'); resetForm(); setSelectedFilmRoll(null); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'projects' && !selectedFilmRoll
              ? 'border-yellow-500 text-yellow-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📂 Projets
        </button>
        <button
          onClick={() => { setActiveTab('photos'); resetForm(); setSelectedFilmRoll(null); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'photos' && !selectedFilmRoll
              ? 'border-yellow-500 text-yellow-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          🖼️ Photos
        </button>
        <button
          onClick={() => { setActiveTab('gear'); resetForm(); setSelectedFilmRoll(null); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'gear' && !selectedFilmRoll
              ? 'border-yellow-500 text-yellow-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📷 Matériel Photo
        </button>
        <button
          onClick={() => { setActiveTab('films'); resetForm(); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'films' || selectedFilmRoll
              ? 'border-yellow-500 text-yellow-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          🎞️ Pellicules {selectedFilmRoll && `(${selectedFilmRoll.name})`}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : selectedFilmRoll ? (
        /* ========================================================================= */
        /* VIEW: PLANCHE-CONTACT (VISUALISATION DU ROULEAU FILME) */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div>
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                PLANCHE-CONTACT ARGENTIQUE
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">{selectedFilmRoll.name}</h2>
              <p className="text-xs text-gray-400 mt-1">
                Film: {selectedFilmRoll.brand} {selectedFilmRoll.filmType} (ISO {selectedFilmRoll.iso}) | Format:{' '}
                {selectedFilmRoll.format === '135' ? '35mm' : selectedFilmRoll.format === '120' ? '120' : 'Plan-film 4x5'}
              </p>
              {selectedFilmRoll.gearCameraId && (
                <p className="text-xs text-gray-400 mt-1">
                  Boîtier : {selectedFilmRoll.gearCameraId.brand} {selectedFilmRoll.gearCameraId.model}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilmRoll(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                &larr; Retour aux Pellicules
              </button>
            </div>
          </div>

          {/* Guide d'aide rapide */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-xs text-gray-300 space-y-2">
            <h4 className="font-bold text-yellow-500 flex items-center gap-1.5">
              💡 Guide de saisie des photos argentiques
            </h4>
            <p>
              Chaque case ci-dessous représente une vue (ou plan-film) de votre pellicule. 
              Pour ajouter une image à une vue, cliquez sur <strong>"Associer"</strong>. Vous pourrez alors :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Choisir une photo existante depuis votre <strong>Galerie</strong>.</li>
              <li>Ou utiliser l'onglet <strong>"Téléverser une image"</strong> pour importer une nouvelle photo directement pour cette case.</li>
            </ul>
            <p className="text-gray-400 italic">
              Les paramètres par défaut de la pellicule (boîtier, objectifs, réglages d'exposition, etc.) seront automatiquement appliqués aux photos associées.
            </p>
          </div>

          {/* Grille planche-contact */}
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: selectedFilmRoll.maxViews }).map((_, idx) => {
              const viewNum = idx + 1;
              const associatedPhoto = myPhotos.find(
                p => p.filmId === selectedFilmRoll._id && p.filmFrameNumber === viewNum
              );

              return (
                <div
                  key={viewNum}
                  className="bg-black/30 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between aspect-[3/4] relative group hover:border-yellow-500/40 transition"
                >
                  <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded text-yellow-500">
                    {selectedFilmRoll.format === 'plan-film' ? 'Plan-film' : `Vue ${viewNum}`}
                  </div>

                  {associatedPhoto ? (
                    <>
                      <div className="flex-1 w-full bg-black/50 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={`/uploads/${associatedPhoto.filename}`}
                          alt={associatedPhoto.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay au hover */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition duration-200">
                          <p className="text-xs font-bold text-center px-2 line-clamp-2">{associatedPhoto.title}</p>
                          {associatedPhoto.exposureSettings?.aperture && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              {associatedPhoto.exposureSettings.aperture} | {associatedPhoto.exposureSettings.shutterSpeed}
                            </p>
                          )}
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => handleUnlinkPhotoFromSlot(associatedPhoto._id)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded p-1 text-[10px] font-bold uppercase transition"
                              title="Détacher la photo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-3xl opacity-20">🎞️</span>
                      <button
                        onClick={() => setShowPhotoPickerForSlot(viewNum)}
                        className="mt-3 bg-white/5 hover:bg-yellow-500 hover:text-black border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold transition uppercase tracking-wider"
                      >
                        Associer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sub-modal: Photo Picker */}
          {showPhotoPickerForSlot !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[80vh] flex flex-col text-white">
                <button
                  onClick={() => {
                    setShowPhotoPickerForSlot(null);
                    setPickerSearch('');
                    setFilterByCameraTag(false);
                    setPickerTab('gallery');
                    setUploadFile(null);
                  }}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-1">
                  Associer une photo au{' '}
                  {selectedFilmRoll.format === 'plan-film'
                    ? 'Plan-film'
                    : `Vue #${showPhotoPickerForSlot}`}
                </h3>
                <p className="text-xs text-gray-400 mb-4">Choisissez une photo de votre galerie ou téléversez-la directement.</p>

                <div className="flex border-b border-white/10 mb-4">
                  <button
                    onClick={() => setPickerTab('gallery')}
                    className={`flex-1 text-center py-2 text-xs font-semibold transition ${
                      pickerTab === 'gallery'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Choisir depuis la galerie
                  </button>
                  <button
                    onClick={() => setPickerTab('upload')}
                    className={`flex-1 text-center py-2 text-xs font-semibold transition ${
                      pickerTab === 'upload'
                        ? 'text-yellow-500 border-b-2 border-yellow-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Téléverser directement
                  </button>
                </div>

                {pickerTab === 'gallery' && (
                  <>
                    {/* Filtre / Recherche */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                      <input
                        type="text"
                        placeholder="Filtrer par titre ou tag..."
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterByCameraTag}
                          onChange={e => setFilterByCameraTag(e.target.checked)}
                          className="w-3.5 h-3.5 text-yellow-500 rounded bg-transparent border-white/20 focus:ring-0 cursor-pointer"
                        />
                        Uniquement tag 'camera'
                      </label>
                    </div>
                  </>
                )}

                {pickerTab === 'gallery' && (
                  <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-2 flex-1">
                    {myPhotos
                      .filter(p => {
                        if (p.filmId) return false;
                        if (pickerSearch) {
                          const q = pickerSearch.toLowerCase();
                          const matchTitle = p.title?.toLowerCase().includes(q);
                          const matchTags = p.tags?.some((t: string) => t.toLowerCase().includes(q));
                          if (!matchTitle && !matchTags) return false;
                        }
                        if (filterByCameraTag) {
                          const hasCameraTag = p.tags?.some((t: string) => {
                            const lt = t.toLowerCase();
                            return lt === 'camera' || lt === 'camara';
                          });
                          if (!hasCameraTag) return false;
                        }
                        return true;
                      })
                      .map(p => (
                        <div
                          key={p._id}
                          onClick={() => {
                            handleLinkPhotoToSlot(p._id);
                            setPickerSearch('');
                            setFilterByCameraTag(false);
                          }}
                          className="bg-black/40 rounded-lg overflow-hidden aspect-square border border-white/5 hover:border-yellow-500 cursor-pointer relative group"
                        >
                          <img src={`/uploads/${p.filename}`} alt={p.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-1.5 transition duration-150">
                            <p className="text-[9px] truncate w-full text-white font-medium">{p.title}</p>
                            {p.tags && p.tags.length > 0 && (
                              <p className="text-[7px] truncate w-full text-yellow-500">{p.tags.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      ))}

                    {myPhotos.filter(p => !p.filmId).length === 0 ? (
                      <div className="col-span-3 text-center py-12 text-gray-500 text-xs">
                        Toutes vos photos importées ont déjà été assignées à un rouleau.
                      </div>
                    ) : (
                      myPhotos.filter(p => {
                        if (p.filmId) return false;
                        if (pickerSearch) {
                          const q = pickerSearch.toLowerCase();
                          const matchTitle = p.title?.toLowerCase().includes(q);
                          const matchTags = p.tags?.some((t: string) => t.toLowerCase().includes(q));
                          if (!matchTitle && !matchTags) return false;
                        }
                        if (filterByCameraTag) {
                          const hasCameraTag = p.tags?.some((t: string) => {
                            const lt = t.toLowerCase();
                            return lt === 'camera' || lt === 'camara';
                          });
                          if (!hasCameraTag) return false;
                        }
                        return true;
                      }).length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-500 text-xs">
                          Aucune photo ne correspond aux filtres.
                        </div>
                      )
                    )}
                  </div>
                )}

                {pickerTab === 'upload' && (
                  <form onSubmit={handleDirectUploadToSlot} className="space-y-4 flex-1 overflow-y-auto pr-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Album de destination *</label>
                      <select
                        value={selectedUploadAlbumId}
                        onChange={e => setSelectedUploadAlbumId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                        required
                      >
                        <option value="">Sélectionner un album</option>
                        {userAlbums.map(a => (
                          <option key={a._id} value={a._id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Fichier image *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploading || !selectedUploadAlbumId || !uploadFile}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition disabled:opacity-50 mt-4 text-xs uppercase tracking-wider"
                    >
                      {uploading ? '⏳ Téléversement en cours...' : 'Téléverser et associer'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* TAB: PROJECTS */}
          {/* ========================================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Mes Projets de prise de vue</h2>
                {!showAddProject && (
                  <button
                    onClick={() => { resetForm(); setShowAddProject(true); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-yellow-950/20"
                  >
                    + Nouveau Projet
                  </button>
                )}
              </div>

              {showAddProject && (
                <form onSubmit={handleSaveProject} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 max-w-xl">
                  <h3 className="text-lg font-bold text-yellow-400">{editingItem ? 'Modifier le projet' : 'Créer un nouveau projet'}</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nom du projet *</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: Matinées brumeuses, Lisbonne en été..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Description / Intention artistique</label>
                      <textarea
                        value={projectDesc}
                        onChange={e => setProjectDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm resize-none"
                        placeholder="Décrivez l'intention artistique globale du projet..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Image de couverture (Nom de fichier)</label>
                      <input
                        type="text"
                        value={projectCover}
                        onChange={e => setProjectCover(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm font-mono"
                        placeholder="ex: 1772987727758.jpg (optionnel)"
                      />
                    </div>
                    {/* SECRET DE FABRICATION PROJET */}
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-purple-400">🎬 Secret de fabrication (Optionnel)</label>
                        <div className="flex gap-2">
                          <label
                            htmlFor="project-making-of-upload"
                            className={`cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                              projectMakingOfUploading
                                ? 'border-purple-400/30 text-purple-400/50'
                                : 'border-purple-400/50 text-purple-400 hover:bg-purple-400/10'
                            } transition`}
                            title="Insérer une image"
                          >
                            {projectMakingOfUploading ? '⏳ Upload...' : '📎 Image'}
                          </label>
                          <input
                            id="project-making-of-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={projectMakingOfUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setProjectMakingOfUploading(true);
                              try {
                                const formData = new FormData();
                                formData.append('image', file);
                                const res = await api.post('/photos/making-of/upload', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                const url = res.data.url;
                                const mdSnippet = `\n![${file.name}](${url})\n`;
                                setProjectMakingOf(prev => prev + mdSnippet);
                              } catch (err) {
                                alert('Erreur lors de l\'upload de l\'image');
                              } finally {
                                setProjectMakingOfUploading(false);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setProjectMakingOfPreview(p => !p)}
                            className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-purple-400/50 text-purple-400 hover:bg-purple-400/10 transition"
                          >
                            {projectMakingOfPreview ? '✏️ Éditer' : '👁 Aperçu'}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">Markdown supporté : **gras**, *italique*, # titres, ![alt](url)</p>
                      {projectMakingOfPreview ? (
                        <div
                          className="w-full min-h-[120px] bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-200 prose prose-invert max-w-none overflow-auto"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {projectMakingOf || <span className="text-gray-600 italic">Aucun contenu</span>}
                        </div>
                      ) : (
                        <textarea
                          value={projectMakingOf}
                          onChange={e => setProjectMakingOf(e.target.value)}
                          rows={4}
                          placeholder={`Racontez le secret de fabrication de ce projet...\n\nEx: # Recherches préparatoires\nVoici mes dessins de recherche pour ce projet...\n\n![Dessin préparatoire](/uploads/making-of/croquis.jpg)`}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-xs resize-y font-mono leading-relaxed placeholder-gray-600 focus:outline-none focus:border-purple-400/50"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="pub"
                        checked={projectPublished}
                        onChange={e => setProjectPublished(e.target.checked)}
                        className="w-4 h-4 rounded text-yellow-500 focus:ring-0 bg-black/40 border-white/10 animate-none"
                      />
                      <label htmlFor="pub" className="text-sm text-gray-300 select-none cursor-pointer">
                        Publier (Visible dans le Carnet de routes)
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                    >
                      {editingItem ? 'Enregistrer' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                  Aucun projet de prise de vue enregistré.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map(p => (
                    <div key={p._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/10 transition">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white truncate">{p.name}</h3>
                          <button
                            onClick={() => handleToggleProjectPublish(p)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                              p.isPublished
                                ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50'
                                : 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/50'
                            }`}
                            title="Cliquer pour basculer le statut"
                          >
                            {p.isPublished ? '✓ Public' : '✕ Masqué'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-3 mb-4">{p.description || 'Aucune description.'}</p>
                        <div className="text-[11px] text-gray-500 font-mono mb-4">
                          Slug : {p.slug}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleProjectPublish(p)}
                            className={`text-xs px-2 py-1 rounded transition font-bold ${
                              p.isPublished
                                ? 'bg-green-700/80 hover:bg-green-600 text-white'
                                : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300'
                            }`}
                          >
                            {p.isPublished ? 'En Ligne' : 'Hors Ligne'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const projectUrl = `${window.location.origin}/project/${p.slug}`;
                              setShareItem({
                                type: 'project',
                                title: p.name,
                                url: projectUrl,
                                htmlCode: `<a href="${projectUrl}" target="_blank">${p.name}</a>`
                              });
                            }}
                            className="text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Partager
                          </button>
                          <a
                            href={getProjectPublicUrl(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Voir
                          </a>
                          <button
                            onClick={() => handleEditProject(p)}
                            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p._id)}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PHOTOS */}
          {/* ========================================================================= */}
          {activeTab === 'photos' && (() => {
            const filteredPhotos = myPhotos.filter(p =>
              (p.title || 'Sans titre').toLowerCase().includes(searchPhotoQuery.toLowerCase()) ||
              (p.filename || '').toLowerCase().includes(searchPhotoQuery.toLowerCase())
            );
            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-bold">Mes Photos</h2>
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={searchPhotoQuery}
                      onChange={e => setSearchPhotoQuery(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm"
                      placeholder="Rechercher par nom..."
                    />
                  </div>
                </div>

                {myPhotos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                    Aucune photo importée.
                  </div>
                ) : filteredPhotos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                    Aucune photo ne correspond à votre recherche.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPhotos.map(p => (
                      <div key={p._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/10 transition">
                        <div className="space-y-4">
                          <div className="aspect-[4/3] w-full bg-black/40 rounded-xl overflow-hidden relative">
                          <img
                            src={`/uploads/${p.filename}`}
                            alt={p.title || 'Sans titre'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleTogglePhotoShowOnBlog(p)}
                            className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                              p.showOnBlog
                                ? 'bg-green-600/80 text-green-100 hover:bg-green-600'
                                : 'bg-gray-600/80 text-gray-300 hover:bg-gray-600'
                            }`}
                            title="Cliquer pour basculer la visibilité"
                          >
                            {p.showOnBlog ? '✓ Public' : '✕ Masqué'}
                          </button>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white truncate">{p.title || 'Sans titre'}</h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{p.description || 'Aucune description.'}</p>
                          {p.location && (
                            <p className="text-[10px] text-gray-500 mt-1">📍 {p.location}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.gearCameraId && (
                              <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-gray-400">
                                📷 {p.gearCameraId.brand} {p.gearCameraId.model}
                              </span>
                            )}
                            {p.isAnalog && p.filmId && (
                              <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded font-mono text-yellow-400">
                                🧪 {p.filmId.brand} {p.filmId.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTogglePhotoShowOnBlog(p)}
                            className={`text-xs px-2 py-1 rounded transition font-bold ${
                              p.showOnBlog
                                ? 'bg-green-700/80 hover:bg-green-600 text-white'
                                : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300'
                            }`}
                          >
                            {p.showOnBlog ? '✓ Public' : '✕ Masqué'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const photoUrl = `${window.location.origin}/uploads/${p.filename}`;
                              setShareItem({
                                type: 'photo',
                                title: p.title || 'Sans titre',
                                url: photoUrl,
                                htmlCode: `<img src="${photoUrl}" alt="${p.title || 'Photo'}" />`
                              });
                            }}
                            className="text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Partager
                          </button>
                          <a
                            href={`/uploads/${p.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Voir
                          </a>
                          <button
                            onClick={() => setEditingPhoto(p)}
                            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(p._id)}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB: GEAR */}
          {/* ========================================================================= */}
          {activeTab === 'gear' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Mon Matériel Photo (Boîtiers & Objectifs)</h2>
                {!showAddGear && (
                  <button
                    onClick={() => { resetForm(); setShowAddGear(true); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-yellow-950/20"
                  >
                    + Ajouter un Matériel
                  </button>
                )}
              </div>

              {showAddGear && (
                <form onSubmit={handleSaveGear} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 max-w-xl">
                  <h3 className="text-lg font-bold text-yellow-400">{editingItem ? 'Modifier le matériel' : 'Ajouter un matériel'}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Type de matériel *</label>
                      <select
                        value={gearType}
                        onChange={e => setGearType(e.target.value as 'camera' | 'lens')}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="camera">Boîtier (Appareil photo)</option>
                        <option value="lens">Objectif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Format * (Pellicule ou Capteur)</label>
                      <input
                        type="text"
                        value={gearFormat}
                        onChange={e => setGearFormat(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: 35mm, 120, Plein format, APS-C..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Marque *</label>
                      <input
                        type="text"
                        value={gearBrand}
                        onChange={e => setGearBrand(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: Leica, Canon, Hasselblad..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Modèle / Caractéristique *</label>
                      <input
                        type="text"
                        value={gearModel}
                        onChange={e => setGearModel(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: M6, AE-1, 50mm f/1.4..."
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Numéro de série</label>
                      <input
                        type="text"
                        value={gearSerial}
                        onChange={e => setGearSerial(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm font-mono"
                        placeholder="ex: 2948759 (optionnel)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Notes / Remarques</label>
                      <input
                        type="text"
                        value={gearNotes}
                        onChange={e => setGearNotes(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: Mise au point manuelle, cellule HS..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                    >
                      {editingItem ? 'Enregistrer' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {gear.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                  Aucun matériel enregistré dans votre inventaire.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* BOITIERS */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-yellow-500 border-b border-yellow-500/20 pb-2">📷 Boîtiers</h3>
                    <div className="space-y-3">
                      {gear.filter(g => g.type === 'camera').map(g => (
                        <div key={g._id} className="bg-white/5 border border-white/5 hover:border-white/10 p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white text-sm">{g.brand} {g.model}</p>
                            <p className="text-xs text-gray-400">Format: {g.format} {g.serialNumber && `| N°: ${g.serialNumber}`}</p>
                            {g.notes && <p className="text-xs text-gray-500 italic mt-1">"{g.notes}"</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditGear(g)} className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2.5 py-1.5 rounded-lg">Modifier</button>
                            <button onClick={() => handleDeleteGear(g._id)} className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg">Supprimer</button>
                          </div>
                        </div>
                      ))}
                      {gear.filter(g => g.type === 'camera').length === 0 && (
                        <p className="text-xs text-gray-500 italic">Aucun boîtier enregistré.</p>
                      )}
                    </div>
                  </div>

                  {/* OBJECTIFS */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-yellow-500 border-b border-yellow-500/20 pb-2">🔍 Objectifs</h3>
                    <div className="space-y-3">
                      {gear.filter(g => g.type === 'lens').map(g => (
                        <div key={g._id} className="bg-white/5 border border-white/5 hover:border-white/10 p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white text-sm">{g.brand} {g.model}</p>
                            <p className="text-xs text-gray-400">Format: {g.format} {g.serialNumber && `| N°: ${g.serialNumber}`}</p>
                            {g.notes && <p className="text-xs text-gray-500 italic mt-1">"{g.notes}"</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditGear(g)} className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2.5 py-1.5 rounded-lg">Modifier</button>
                            <button onClick={() => handleDeleteGear(g._id)} className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg">Supprimer</button>
                          </div>
                        </div>
                      ))}
                      {gear.filter(g => g.type === 'lens').length === 0 && (
                        <p className="text-xs text-gray-500 italic">Aucun objectif enregistré.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: FILMS */}
          {/* ========================================================================= */}
          {activeTab === 'films' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold">Mes Pellicules (Rouleaux & Châssis)</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <input
                    type="text"
                    value={searchFilmQuery}
                    onChange={e => setSearchFilmQuery(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm w-full sm:w-64"
                    placeholder="Rechercher par nom / marque..."
                  />
                  {!showAddFilm && (
                    <button
                      onClick={() => { resetForm(); setShowAddFilm(true); }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-yellow-950/20 whitespace-nowrap"
                    >
                      + Enregistrer une Pellicule (Rouleau/Châssis)
                    </button>
                  )}
                </div>
              </div>

              {showAddFilm && (
                <form onSubmit={handleSaveFilm} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 max-w-xl">
                  <h3 className="text-lg font-bold text-yellow-400">
                    {editingItem ? 'Modifier le rouleau' : 'Enregistrer un nouveau rouleau de pellicule'}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nom / Identifiant unique du rouleau *</label>
                      <input
                        type="text"
                        value={filmName}
                        onChange={e => setFilmName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: Tri-X #01, HP5 Écosse, Châssis 4x5 #A..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Marque / Fabricant *</label>
                      <select
                        value={['Kodak', 'Fomapan', 'Ilford', 'AgfaPan'].includes(filmBrand) ? filmBrand : (filmBrand ? 'Autre' : '')}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Autre') {
                            setFilmBrand('');
                          } else {
                            setFilmBrand(val);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm mb-2"
                        required
                      >
                        <option value="">Sélectionner une marque</option>
                        <option value="Kodak">Kodak</option>
                        <option value="Fomapan">Fomapan</option>
                        <option value="Ilford">Ilford</option>
                        <option value="AgfaPan">AgfaPan</option>
                        <option value="Autre">Autre (Saisir manuellement)</option>
                      </select>
                      {!['Kodak', 'Fomapan', 'Ilford', 'AgfaPan'].includes(filmBrand) && (
                        <input
                          type="text"
                          value={filmBrand}
                          onChange={e => setFilmBrand(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm animate-none"
                          placeholder="Saisir la marque personnalisée..."
                          required
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Type de film (Émulsion) *</label>
                      <select
                        value={['Fomapan 100', 'Fomapan 200', 'Fomapan 400', 'AgfaPan 100', 'Kodak X 320', 'FP4', 'HP5', 'Tri X400'].includes(filmType) ? filmType : (filmType ? 'Autre' : '')}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Autre') {
                            setFilmType('');
                          } else {
                            setFilmType(val);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm mb-2"
                        required
                      >
                        <option value="">Sélectionner une émulsion</option>
                        <option value="Fomapan 100">Fomapan 100</option>
                        <option value="Fomapan 200">Fomapan 200</option>
                        <option value="Fomapan 400">Fomapan 400</option>
                        <option value="AgfaPan 100">AgfaPan 100</option>
                        <option value="Kodak X 320">Kodak X 320</option>
                        <option value="FP4">FP4</option>
                        <option value="HP5">HP5</option>
                        <option value="Tri X400">Tri X400</option>
                        <option value="Autre">Autre (Saisir manuellement)</option>
                      </select>
                      {!['Fomapan 100', 'Fomapan 200', 'Fomapan 400', 'AgfaPan 100', 'Kodak X 320', 'FP4', 'HP5', 'Tri X400'].includes(filmType) && (
                        <input
                          type="text"
                          value={filmType}
                          onChange={e => setFilmType(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm animate-none"
                          placeholder="Saisir l'émulsion personnalisée..."
                          required
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Sensibilité nominale (ISO) *</label>
                      <input
                        type="number"
                        value={filmIso}
                        onChange={e => setFilmIso(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm mb-2"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Sensibilité utilisée (ISO)</label>
                      <input
                        type="number"
                        value={filmIsoUsed}
                        onChange={e => setFilmIsoUsed(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: 800 (optionnel)"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Format *</label>
                      <select
                        value={['135', '6X6', '9x12', '4X5', '13x18'].includes(filmFormat) ? filmFormat : (filmFormat ? 'Autre' : '')}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Autre') {
                            setFilmFormat('');
                          } else {
                            setFilmFormat(val as any);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm mb-2"
                        required
                      >
                        <option value="">Sélectionner un format</option>
                        <option value="135">135 (35mm)</option>
                        <option value="6X6">6X6</option>
                        <option value="9x12">9x12</option>
                        <option value="4X5">4X5</option>
                        <option value="13x18">13x18</option>
                        <option value="Autre">Autre (Saisir manuellement)</option>
                      </select>
                      {!['135', '6X6', '9x12', '4X5', '13x18'].includes(filmFormat) && (
                        <input
                          type="text"
                          value={filmFormat}
                          onChange={e => setFilmFormat(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm animate-none"
                          placeholder="Saisir le format personnalisé..."
                          required
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre de vues (max) *</label>
                      <input
                        type="number"
                        value={filmMaxViews}
                        onChange={e => setFilmMaxViews(parseInt(e.target.value) || 36)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Type de couleur *</label>
                      <select
                        value={filmTypeColor}
onChange={e => setFilmTypeColor(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="BW">Noir & Blanc</option>
                        <option value="color">Couleur Négatif</option>
                        <option value="slide">Diapositive</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Boîtier photo utilisé *</label>
                      <select
                        value={filmGearCameraId}
                        onChange={e => setFilmGearCameraId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        required
                      >
                        <option value="">Sélectionner l'appareil utilisé</option>
                        {gear
                          .filter(g => g.type === 'camera')
                          .map(g => (
                            <option key={g._id} value={g._id}>
                              {g.brand} {g.model} ({g.format})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Objectif photo utilisé par défaut</label>
                      <select
                        value={filmGearLensId}
                        onChange={e => setFilmGearLensId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                      >
                        <option value="">Sélectionner l'objectif par défaut</option>
                        {gear
                          .filter(g => g.type === 'lens')
                          .map(g => (
                            <option key={g._id} value={g._id}>
                              {g.brand} {g.model} ({g.format})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* SECTION PARAMETRES DE PRISE DE VUE PAR DEFAUT */}
                    <div className="sm:col-span-2 border-t border-white/10 pt-4 space-y-3">
                      <h4 className="text-sm font-bold text-yellow-500">📸 Paramètres de Prise de vue (Par défaut)</h4>
                      <p className="text-[10px] text-gray-400">Ces réglages s'appliqueront par défaut aux photos de ce rouleau/film.</p>
                      
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] text-gray-400 mb-1">Vitesse</label>
                          <select
                            value={filmDefaultSpeed}
                            onChange={e => setFilmDefaultSpeed(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="">Sélectionner</option>
                            {['B', '8s', '4s', '2s', '1s', '1/2s', '1/4s', '1/8s', '1/15s', '1/30s', '1/50s', '1/60s', '1/125s', '1/250s', '1/400s', '1/500s'].map(val => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] text-gray-400 mb-1">Diaphragme</label>
                          <select
                            value={filmDefaultAperture}
                            onChange={e => setFilmDefaultAperture(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="">Sélectionner</option>
                            {['f/1,4', 'f/1,7', 'f/1,8', 'f/2,8', 'f/3,5', 'f/4', 'f/5,6', 'f/6,3', 'f/8', 'f/11', 'f/16', 'f/22', 'f/32', 'f/45', 'f/64'].map(val => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Filtre</label>
                          <select
                            value={filmDefaultFilter}
                            onChange={e => setFilmDefaultFilter(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="Aucun">Aucun</option>
                            <option value="Rouge">Rouge</option>
                            <option value="Bleu">Bleu</option>
                            <option value="Vert">Vert</option>
                            <option value="Jaune">Jaune</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Filtre ND</label>
                          <select
                            value={filmDefaultNdFilter}
                            onChange={e => setFilmDefaultNdFilter(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="Aucun">Aucun</option>
                            <option value="1">ND1 (1 stop)</option>
                            <option value="2">ND2 (2 stops)</option>
                            <option value="4">ND4 (4 stops)</option>
                            <option value="8">ND8 (8 stops)</option>
                            <option value="16">ND16 (16 stops)</option>
                            <option value="100">ND100 (100 stops)</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5 pt-4">
                          <input
                            type="checkbox"
                            id="lens-hood"
                            checked={filmDefaultLensHood}
                            onChange={e => setFilmDefaultLensHood(e.target.checked)}
                            className="w-3.5 h-3.5 text-yellow-500 rounded bg-transparent border-white/20 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="lens-hood" className="text-[10px] text-gray-300 font-semibold select-none cursor-pointer">
                            Parasoleil
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* SECTION CHIMIE DU ROULEAU */}
                    <div className="sm:col-span-2 border-t border-white/10 pt-4 space-y-3">
                      <h4 className="text-sm font-bold text-yellow-500">🧪 Chimie de développement (Par défaut)</h4>
                      <p className="text-[10px] text-gray-400">Ces réglages s'appliqueront à l'ensemble du rouleau (ou serviront de base pour le plan-film).</p>
                      
                      <h5 className="text-[11px] font-bold text-yellow-600">Révélateur</h5>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Nom du Révélateur</label>
                          <select
                            value={['Kodak D76', 'Ilford ID11', 'Ilford Microphen', 'Fomapan'].includes(devDeveloper) ? devDeveloper : (devDeveloper ? 'Autre' : '')}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'Autre') {
                                setDevDeveloper('');
                              } else {
                                setDevDeveloper(val);
                              }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs mb-2"
                          >
                            <option value="">Sélectionner</option>
                            <option value="Kodak D76">Kodak D76</option>
                            <option value="Ilford ID11">Ilford ID11</option>
                            <option value="Ilford Microphen">Ilford Microphen</option>
                            <option value="Fomapan">Fomapan</option>
                            <option value="Autre">Autre (Saisir manuellement)</option>
                          </select>
                          {!['Kodak D76', 'Ilford ID11', 'Ilford Microphen', 'Fomapan'].includes(devDeveloper) && (
                            <input
                              type="text"
                              value={devDeveloper}
                              onChange={e => setDevDeveloper(e.target.value)}
                              placeholder="Révélateur personnalisé..."
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs animate-none"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Dilution</label>
                          <select
                            value={devDilution}
                            onChange={e => setDevDilution(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="">Sélectionner</option>
                            <option value="stock">stock</option>
                            <option value="1+1">1+1</option>
                            <option value="1+3">1+3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Temps de dev</label>
                          <div className="flex gap-1 items-center">
                            <select
                              value={devTimeMin}
                              onChange={e => setDevTimeMin(Number(e.target.value))}
                              className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs w-1/2"
                            >
                              {Array.from({ length: 61 }, (_, i) => i).map(m => (
                                <option key={m} value={m}>{m} min</option>
                              ))}
                            </select>
                            <select
                              value={devTimeSec}
                              onChange={e => setDevTimeSec(Number(e.target.value))}
                              className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs w-1/2"
                            >
                              {Array.from({ length: 60 }, (_, i) => i).map(s => (
                                <option key={s} value={s}>{s} sec</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Température</label>
                          <select
                            value={devTemperature}
                            onChange={e => setDevTemperature(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="">Sélectionner</option>
                            {Array.from({ length: 18 }, (_, i) => 20 + i).map(t => (
                              <option key={t} value={`${t}°C`}>{t}°C</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Agitation</label>
                          <input
                            type="text"
                            value={devAgitation}
                            onChange={e => setDevAgitation(e.target.value)}
                            placeholder="ex: 10s/min"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Pousse/Retenu</label>
                          <input
                            type="text"
                            value={devPushPull}
                            onChange={e => setDevPushPull(e.target.value)}
                            placeholder="ex: N+1, -1 stop"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* SECTION FIXATEUR DU ROULEAU */}
                      <h5 className="text-[11px] font-bold text-yellow-600 pt-2">Fixateur</h5>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Nom du Fixateur</label>
                          <select
                            value={devFixerBrand}
                            onChange={e => setDevFixerBrand(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          >
                            <option value="">Sélectionner</option>
                            <option value="Autre">Autre</option>
                            <option value="Ilford Rapid Fixer">Ilford Rapid Fixer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Dilution Fixateur</label>
                          <input
                            type="text"
                            value={devFixerDilution}
                            onChange={e => setDevFixerDilution(e.target.value)}
                            placeholder="ex: 1+4"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">Temps de Fixation</label>
                          <input
                            type="text"
                            value={devFixerTime}
                            onChange={e => setDevFixerTime(e.target.value)}
                            placeholder="ex: 5mn"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Notes / Infos complémentaires</label>
                      <input
                        type="text"
                        value={filmNotes}
                        onChange={e => setFilmNotes(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                        placeholder="ex: Exposé à 320 ISO, développement à façon..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                    >
                      {editingItem ? 'Enregistrer' : 'Enregistrer le rouleau'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {(() => {
                const filteredFilms = films.filter(f =>
                  (f.name || '').toLowerCase().includes(searchFilmQuery.toLowerCase()) ||
                  (f.brand || '').toLowerCase().includes(searchFilmQuery.toLowerCase()) ||
                  (f.filmType || '').toLowerCase().includes(searchFilmQuery.toLowerCase())
                );
                return films.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                    Aucune pellicule (rouleau/châssis) enregistrée.
                  </div>
                ) : filteredFilms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                    Aucune pellicule ne correspond à votre recherche.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFilms.map(f => (
                      <div
                        key={f._id}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:bg-white/10 transition"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-bold text-white text-sm truncate">{f.name}</h3>
                            <p className="text-xs text-gray-400">
                              {f.brand} {f.filmType} (ISO {f.iso})
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              f.format === 'plan-film'
                                ? 'bg-purple-600/30 text-purple-300'
                                : f.format === '120'
                                ? 'bg-blue-600/30 text-blue-300'
                                : 'bg-green-600/30 text-green-300'
                            }`}
                          >
                            {f.format === 'plan-film' ? 'Plan-film 4x5' : f.format === '120' ? '120' : '35mm'}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <p>
                            Capacité : <span className="text-white font-medium">{f.maxViews} vues</span>
                          </p>
                          {f.gearCameraId && (
                            <p>
                              Boîtier :{' '}
                              <span className="text-white font-medium">
                                {f.gearCameraId.brand} {f.gearCameraId.model}
                              </span>
                            </p>
                          )}
                          {f.gearLensId && (
                            <p>
                              Objectif :{' '}
                              <span className="text-white font-medium">
                                {f.gearLensId.brand} {f.gearLensId.model}
                              </span>
                            </p>
                          )}
                          {f.defaultExposureSettings && (f.defaultExposureSettings.shutterSpeed || f.defaultExposureSettings.aperture || (f.defaultExposureSettings.filter && f.defaultExposureSettings.filter !== 'Aucun') || (f.defaultExposureSettings.ndFilter && f.defaultExposureSettings.ndFilter !== 'Aucun') || f.defaultExposureSettings.lensHood) && (
                            <p>
                              Prise de vue :{' '}
                              <span className="text-gray-300 font-medium font-mono text-[10px]">
                                {f.defaultExposureSettings.shutterSpeed && `${f.defaultExposureSettings.shutterSpeed} `}
                                {f.defaultExposureSettings.aperture && `@ ${f.defaultExposureSettings.aperture} `}
                                {f.defaultExposureSettings.filter && f.defaultExposureSettings.filter !== 'Aucun' && `[Filtre: ${f.defaultExposureSettings.filter}] `}
                                {f.defaultExposureSettings.ndFilter && f.defaultExposureSettings.ndFilter !== 'Aucun' && `[ND: ${f.defaultExposureSettings.ndFilter}] `}
                                {f.defaultExposureSettings.lensHood && `[Parasoleil]`}
                              </span>
                            </p>
                          )}
                          {f.developmentSettings?.developer && (
                            <p>
                              Chimie :{' '}
                              <span className="text-yellow-500 font-mono">
                                {f.developmentSettings.developer} ({f.developmentSettings.dilution})
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-white/5 mt-4">
                        <button
                          onClick={() => setSelectedFilmRoll(f)}
                          className="w-full text-center text-xs font-bold text-black bg-yellow-500 hover:bg-yellow-600 py-1.5 rounded-lg transition"
                        >
                          👁️ Voir la Planche-Contact
                        </button>
                         <div className="flex gap-2">
                          <button
                            onClick={() => handleEditFilm(f)}
                            className="flex-1 text-center text-xs font-semibold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 py-1.5 rounded-lg transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDuplicateFilm(f)}
                            className="flex-1 text-center text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-1.5 rounded-lg transition"
                          >
                            Dupliquer
                          </button>
                          <button
                            onClick={() => handleDeleteFilm(f._id)}
                            className="flex-1 text-center text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 py-1.5 rounded-lg transition"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={handleSavePhoto}
        />
      )}
      {shareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 relative text-white">
            <button
              onClick={() => setShareItem(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2">Partager le {shareItem.type === 'project' ? 'projet' : 'média'}</h3>
            <p className="text-xs text-gray-400 mb-4">{shareItem.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Lien de la page</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareItem.url}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareItem.url);
                      alert('Lien copié dans le presse-papiers !');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">
                  {shareItem.type === 'project' ? "Code d'intégration Iframe" : "Code d'intégration Image HTML"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      shareItem.type === 'project'
                        ? `<iframe src="${shareItem.url}" width="100%" height="600" frameborder="0"></iframe>`
                        : `<img src="${shareItem.url}" alt="${shareItem.title}" />`
                    }
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const embedCode = shareItem.type === 'project'
                        ? `<iframe src="${shareItem.url}" width="100%" height="600" frameborder="0"></iframe>`
                        : `<img src="${shareItem.url}" alt="${shareItem.title}" />`;
                      navigator.clipboard.writeText(embedCode);
                      alert("Code d'intégration copié !");
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarnetRoutesManager;
