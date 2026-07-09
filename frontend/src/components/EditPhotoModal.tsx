import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface EditPhotoModalProps {
  photo: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const EditPhotoModal: React.FC<EditPhotoModalProps> = ({ photo, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [index, setIndex] = useState<number>(0);

  // --- Carnet de route States ---
  const [projectId, setProjectId] = useState('');
  const [isAnalog, setIsAnalog] = useState(false);
  const [gearCameraId, setGearCameraId] = useState('');
  const [gearLensId, setGearLensId] = useState('');
  const [filmId, setFilmId] = useState('');
  const [filmFrameNumber, setFilmFrameNumber] = useState<string>('');
  const [showOnBlog, setShowOnBlog] = useState(false);

  // Exposition
  const [aperture, setAperture] = useState('');
  const [shutterSpeed, setShutterSpeed] = useState('');
  const [iso, setIso] = useState('');
  const [focalLength, setFocalLength] = useState('');
  const [light, setLight] = useState('');
  const [filter, setFilter] = useState('Aucun');
  const [ndFilter, setNdFilter] = useState('Aucun');
  const [lensHood, setLensHood] = useState(false);

  // Développement (Surcharges)
  const [developer, setDeveloper] = useState('');
  const [dilution, setDilution] = useState('');
  const [time, setTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [agitation, setAgitation] = useState('');
  const [pushPull, setPushPull] = useState('');

  // Artistique / Lieu / Date
  const [shootingIntent, setShootingIntent] = useState('');
  const [location, setLocation] = useState('');
  const [captureDate, setCaptureDate] = useState('');

  // Secret de fabrication
  const [makingOf, setMakingOf] = useState('');
  const [makingOfPreview, setMakingOfPreview] = useState(false);
  const [makingOfUploading, setMakingOfUploading] = useState(false);

  // Listes de métadonnées issues de la base
  const [projects, setProjects] = useState<any[]>([]);
  const [gear, setGear] = useState<any[]>([]);
  const [films, setFilms] = useState<any[]>([]);

  // Rouleau de film actuellement sélectionné dans le modal
  const [selectedRoll, setSelectedRoll] = useState<any | null>(null);

  useEffect(() => {
    const fetchModalData = async () => {
      try {
        const [projRes, gearRes, filmRes] = await Promise.all([
          api.get('/projects'),
          api.get('/gear'),
          api.get('/films')
        ]);
        setProjects(projRes.data);
        setGear(gearRes.data);
        setFilms(filmRes.data);
      } catch (err) {
        console.error('Error loading metadata lists for photo edit modal', err);
      }
    };
    fetchModalData();
  }, []);

  // Détecter les changements de sélection de pellicule
  useEffect(() => {
    if (filmId) {
      const roll = films.find(f => f._id === filmId);
      setSelectedRoll(roll || null);

      if (roll) {
        // Pré-remplir automatiquement le boîtier à partir du boîtier du rouleau de film si non défini
        if (roll.gearCameraId && !gearCameraId) {
          setGearCameraId(roll.gearCameraId._id || roll.gearCameraId);
        }
        if (roll.gearLensId && !gearLensId) {
          setGearLensId(roll.gearLensId._id || roll.gearLensId);
        }

        // Pré-remplir l'exposition SEULEMENT si aucune valeur spécifique n'est définie sur la photo
        if (!aperture && roll.defaultExposureSettings?.aperture) {
          setAperture(roll.defaultExposureSettings.aperture);
        }
        if (!shutterSpeed && roll.defaultExposureSettings?.shutterSpeed) {
          setShutterSpeed(roll.defaultExposureSettings.shutterSpeed);
        }
        if ((!filter || filter === 'Aucun') && roll.defaultExposureSettings?.filter) {
          setFilter(roll.defaultExposureSettings.filter);
        }
        if ((!ndFilter || ndFilter === 'Aucun') && roll.defaultExposureSettings?.ndFilter) {
          setNdFilter(roll.defaultExposureSettings.ndFilter);
        }
        if (!lensHood && roll.defaultExposureSettings?.lensHood !== undefined) {
          setLensHood(roll.defaultExposureSettings.lensHood);
        }

        // Pré-remplir les valeurs de chimie si aucune surcharge n'a encore été entrée
        if (!developer && !dilution && !time) {
          setDeveloper(roll.developmentSettings?.developer || '');
          setDilution(roll.developmentSettings?.dilution || '');
          setTime(roll.developmentSettings?.time || '');

          setTemperature(roll.developmentSettings?.temperature || '');
          setAgitation(roll.developmentSettings?.agitation || '');
          setPushPull(roll.developmentSettings?.pushPull || '');
        }
      }
    } else {
      setSelectedRoll(null);
    }
  }, [filmId, films]);

  useEffect(() => {
    if (photo) {
      setTitle(photo.title || '');
      setDescription(photo.description || '');
      setTags(Array.isArray(photo.tags) ? photo.tags.join(', ') : '');
      setIndex(photo.index || 0);

      setProjectId(photo.projectId || '');
      setIsAnalog(photo.isAnalog || false);
      setGearCameraId(photo.gearCameraId || '');
      setGearLensId(photo.gearLensId || '');
      setFilmId(photo.filmId || '');
      setFilmFrameNumber(photo.filmFrameNumber !== null && photo.filmFrameNumber !== undefined ? String(photo.filmFrameNumber) : '');
      setShowOnBlog(photo.showOnBlog || false);

      setAperture(photo.exposureSettings?.aperture || '');
      setShutterSpeed(photo.exposureSettings?.shutterSpeed || '');
      setIso(
        photo.exposureSettings?.iso !== null && photo.exposureSettings?.iso !== undefined
          ? String(photo.exposureSettings.iso)
          : ''
      );
      setFocalLength(photo.exposureSettings?.focalLength || '');
      setLight(photo.exposureSettings?.light || '');
      setFilter(photo.exposureSettings?.filter || 'Aucun');
      setNdFilter(photo.exposureSettings?.ndFilter || 'Aucun');
      setLensHood(photo.exposureSettings?.lensHood || false);

      setDeveloper(photo.developmentSettings?.developer || '');
      setDilution(photo.developmentSettings?.dilution || '');
      setTime(photo.developmentSettings?.time || '');
      setTemperature(photo.developmentSettings?.temperature || '');
      setAgitation(photo.developmentSettings?.agitation || '');
      setPushPull(photo.developmentSettings?.pushPull || '');

      setShootingIntent(photo.shootingIntent || '');
      setLocation(photo.location || '');
      setMakingOf(photo.makingOf || '');
      if (photo.captureDate) {
        setCaptureDate(new Date(photo.captureDate).toISOString().substring(0, 10));
      } else {
        setCaptureDate('');
      }
    }
  }, [photo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    // Vérifier si des surcharges de développement ont été saisies
    const hasSurcharges = developer || dilution || time || temperature || agitation || pushPull;

    onSave({
      title,
      description,
      tags: tagsArray,
      index: Number(index),
      projectId: projectId || null,
      isAnalog,
      gearCameraId: gearCameraId || null,
      gearLensId: gearLensId || null,
      filmId: isAnalog && filmId ? filmId : null,
      filmFrameNumber: isAnalog && filmFrameNumber ? Number(filmFrameNumber) : null,
      showOnBlog,
      exposureSettings: {
        aperture,
        shutterSpeed,
        iso: iso ? Number(iso) : null,
        focalLength,
        light,
        filter,
        ndFilter,
        lensHood
      },
      developmentSettings: isAnalog && hasSurcharges
        ? {
            developer,
            dilution,
            time,
            temperature,
            agitation,
            pushPull
          }
        : undefined,
      shootingIntent,
      location,
      captureDate: captureDate ? new Date(captureDate) : null,
      makingOf
    });
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4 text-yellow-500 border-b border-white/10 pb-2">
          Modifier les paramètres de la photo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1">
          {/* SECTION 1: GENERAL & PUBLICATION */}
          <div className="bg-white/5 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-1">
              <h3 className="text-sm font-bold text-gray-300">📁 Informations Générales</h3>
              <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                <input
                  type="checkbox"
                  id="blog-toggle"
                  checked={showOnBlog}
                  onChange={e => setShowOnBlog(e.target.checked)}
                  className="w-3.5 h-3.5 text-yellow-500 rounded bg-transparent border-white/20 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="blog-toggle"
                  className="text-xs text-yellow-500 font-bold select-none cursor-pointer"
                >
                  🌐 Afficher sur le blog
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Projet de Prise de vue (Optionnel)</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">Aucun projet</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Index (Ordre manuel)</label>
                <input
                  type="number"
                  value={index}
                  onChange={e => setIndex(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRISE DE VUE */}
          <div className="bg-white/5 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-1">
              <h3 className="text-sm font-bold text-gray-300">📸 Paramètres de Prise de vue</h3>
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg">
                <input
                  type="checkbox"
                  id="analog-toggle"
                  checked={isAnalog}
                  onChange={e => setIsAnalog(e.target.checked)}
                  className="w-3.5 h-3.5 text-yellow-500 rounded bg-transparent border-white/20 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="analog-toggle"
                  className="text-xs text-yellow-500 font-bold select-none cursor-pointer"
                >
                  🎞️ Argentique
                </label>
              </div>
            </div>

            {isAnalog ? (
              /* ARGENTIQUE : CHOIX DU ROULEAU & DE LA VUE */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-yellow-500/[0.02] border border-yellow-500/10 p-3 rounded-lg">
                <div>
                  <label className="block text-xs text-yellow-500 mb-1 font-semibold">Rouleau de pellicule / Châssis *</label>
                  <select
                    value={filmId}
                    onChange={e => setFilmId(e.target.value)}
                    className="w-full bg-black/30 border border-yellow-500/20 rounded-lg p-2 text-white text-sm font-bold"
                    required
                  >
                    <option value="">Sélectionner la pellicule</option>
                    {films.map(f => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.brand} {f.filmType} | {f.format === 'plan-film' ? 'Plan-film' : f.format === '120' ? '120' : '35mm'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-yellow-500 mb-1 font-semibold">Numéro de vue / Face *</label>
                  <select
                    value={filmFrameNumber}
                    onChange={e => setFilmFrameNumber(e.target.value)}
                    className="w-full bg-black/30 border border-yellow-500/20 rounded-lg p-2 text-white text-sm font-bold"
                    required
                    disabled={!selectedRoll}
                  >
                    <option value="">Choisir la vue</option>
                    {selectedRoll &&
                      Array.from({ length: selectedRoll.maxViews }).map((_, i) => {
                        const val = i + 1;
                        const label = selectedRoll.format === 'plan-film' ? 'Plan-film' : `Vue #${val}`;
                        return (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Boîtier (Appareil)</label>
                <select
                  value={gearCameraId}
                  onChange={e => setGearCameraId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  disabled={isAnalog && !!selectedRoll?.gearCameraId} // Verrouillé si lié par le film
                >
                  <option value="">Sélectionner un appareil</option>
                  {gear
                    .filter(g => g.type === 'camera')
                    .map(g => (
                      <option key={g._id} value={g._id}>
                        {g.brand} {g.model} ({g.format})
                      </option>
                    ))}
                </select>
                {isAnalog && selectedRoll?.gearCameraId && (
                  <p className="text-[9px] text-gray-500 mt-1 italic">Hérité du rouleau de film.</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Objectif utilisé</label>
                <select
                  value={gearLensId}
                  onChange={e => setGearLensId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                >
                  <option value="">Sélectionner un objectif</option>
                  {gear
                    .filter(g => {
                      if (g.type !== 'lens') return false;
                      if (gearCameraId) {
                        const selectedCam = gear.find((c: any) => c._id === gearCameraId);
                        if (selectedCam) {
                          // Normalise formats for comparison:
                          // Sinar F stores '4X5', large-format lenses store 'Plan-film 4x5'
                          const normFmt = (f: string) => {
                            const s = (f || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (s.includes('4x5') || s.includes('planfilm')) return '4x5';
                            if (s.includes('120')) return '120';
                            if (s.includes('35mm')) return '35mm';
                            return s;
                          };
                          return normFmt(g.format) === normFmt(selectedCam.format);
                        }
                      }
                      return true;
                    })
                    .map((g: any) => (
                      <option key={g._id} value={g._id}>
                        {g.brand} {g.model} ({g.format})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Ouverture</label>
                <input
                  type="text"
                  value={aperture}
                  onChange={e => setAperture(e.target.value)}
                  placeholder="ex: f/8"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Vitesse</label>
                <input
                  type="text"
                  value={shutterSpeed}
                  onChange={e => setShutterSpeed(e.target.value)}
                  placeholder="ex: 1/250s"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">ISO</label>
                <input
                  type="number"
                  value={iso}
                  onChange={e => setIso(e.target.value)}
                  placeholder="ex: 400"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Focale</label>
                <input
                  type="text"
                  value={focalLength}
                  onChange={e => setFocalLength(e.target.value)}
                  placeholder="ex: 50mm"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] text-gray-400 mb-0.5">Lumière</label>
                <input
                  type="text"
                  value={light}
                  onChange={e => setLight(e.target.value)}
                  placeholder="ex: Naturelle"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Filtre couleur</label>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                >
                  <option value="Aucun">Aucun</option>
                  <option value="Rouge">Rouge</option>
                  <option value="Bleu">Bleu</option>
                  <option value="Vert">Vert</option>
                  <option value="Jaune">Jaune</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Filtre ND</label>
                <select
                  value={ndFilter}
                  onChange={e => setNdFilter(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs"
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
              <div className="flex items-center gap-1.5 pt-3">
                <input
                  type="checkbox"
                  id="hood-toggle"
                  checked={lensHood}
                  onChange={e => setLensHood(e.target.checked)}
                  className="w-3.5 h-3.5 text-yellow-500 rounded bg-transparent border-white/20 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="hood-toggle"
                  className="text-[10px] text-gray-300 font-bold select-none cursor-pointer"
                >
                  Parasoleil
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Lieu de prise de vue</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  placeholder="ex: Paris, Lisbonne..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Date de capture</label>
                <input
                  type="date"
                  value={captureDate}
                  onChange={e => setCaptureDate(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Intention Artistique Spécifique</label>
                <textarea
                  value={shootingIntent}
                  onChange={e => setShootingIntent(e.target.value)}
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm resize-none"
                  placeholder="Expliquez ce que vous vouliez capturer ou exprimer dans ce cliché..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DEVELOPPEMENT / CHIMIE (Argentique uniquement) */}
          {isAnalog && (
            <div className="bg-white/5 p-4 rounded-xl space-y-3 border border-yellow-500/20">
              <div className="flex justify-between items-center pb-1">
                <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                  🧪 Surcharges de Chimie & Temps
                </h3>
                {selectedRoll?.format === 'plan-film' ? (
                  <span className="text-[9px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold">
                    Plan-film : Saisie recommandée
                  </span>
                ) : (
                  <span className="text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded italic">
                    Optionnel (Hérité du rouleau par défaut)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Révélateur</label>
                  <input
                    type="text"
                    value={developer}
                    onChange={e => setDeveloper(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                    placeholder="Laisser vide pour hériter du rouleau"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dilution</label>
                  <input
                    type="text"
                    value={dilution}
                    onChange={e => setDilution(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                    placeholder="Laisser vide pour hériter du rouleau"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Temps de dev</label>
                  <input
                    type="text"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    placeholder="ex: 10m"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Température</label>
                  <input
                    type="text"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    placeholder="ex: 20°C"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Agitation</label>
                  <input
                    type="text"
                    value={agitation}
                    onChange={e => setAgitation(e.target.value)}
                    placeholder="ex: 10s/min"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Pousse/Retenu</label>
                  <input
                    type="text"
                    value={pushPull}
                    onChange={e => setPushPull(e.target.value)}
                    placeholder="ex: N+1"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-white text-xs text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECRET DE FABRICATION */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400">🎬 Secret de fabrication</h3>
              <div className="flex gap-2">
                <label
                  htmlFor={`making-of-upload-${photo._id}`}
                  className={`cursor-pointer text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                    makingOfUploading
                      ? 'border-purple-400/30 text-purple-400/50'
                      : 'border-purple-400/50 text-purple-400 hover:bg-purple-400/10'
                  } transition`}
                  title="Insérer une image"
                >
                  {makingOfUploading ? '⏳ Upload...' : '📎 Image'}
                </label>
                <input
                  id={`making-of-upload-${photo._id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={makingOfUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setMakingOfUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append('image', file);
                      const res = await api.post('/photos/making-of/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      const url = res.data.url;
                      const mdSnippet = `\n![${file.name}](${url})\n`;
                      setMakingOf(prev => prev + mdSnippet);
                    } catch (err) {
                      alert('Erreur lors de l\'upload de l\'image');
                    } finally {
                      setMakingOfUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMakingOfPreview(p => !p)}
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-purple-400/50 text-purple-400 hover:bg-purple-400/10 transition"
                >
                  {makingOfPreview ? '✏️ Éditer' : '👁 Aperçu'}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Markdown supporté : **gras**, *italique*, # titres, ![alt](url)</p>
            {makingOfPreview ? (
              <div
                className="w-full min-h-[120px] bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-200 prose prose-invert max-w-none overflow-auto"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {makingOf || <span className="text-gray-600 italic">Aucun contenu</span>}
              </div>
            ) : (
              <textarea
                value={makingOf}
                onChange={e => setMakingOf(e.target.value)}
                rows={5}
                placeholder={`Racontez le secret de fabrication de cette photo...\n\nEx: # Préparation\nJ'ai fait un croquis préparatoire la veille...\n\n![Croquis préparatoire](/uploads/making-of/maquette.jpg)`}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-xs resize-y font-mono leading-relaxed placeholder-gray-600 focus:outline-none focus:border-purple-400/50"
              />
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold transition text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded-lg font-bold transition text-sm shadow-md shadow-yellow-950/20"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPhotoModal;
