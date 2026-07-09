import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX } from '../../utils/blogApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Combine projects and standalone photos into a unified sorted feed
const CarnetDeRoutesPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [standalonePhotos, setStandalonePhotos] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const location = useLocation();
  const blogSlug = getBlogSlug(location.search);
  const s = location.search;

  useEffect(() => {
    if (!blogSlug) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_PREFIX}/projects?blog=${blogSlug}`).then(r => r.json()),
      fetch(`${API_PREFIX}/photos?blog=${blogSlug}`).then(r => r.json()),
      fetch(`${API_PREFIX}/user/${blogSlug}`).then(r => r.json()).catch(() => null),
    ])
      .then(([projData, photoData, userData]) => {
        setProjects(Array.isArray(projData) ? projData : []);
        setStandalonePhotos(Array.isArray(photoData) ? photoData : []);
        setUserProfile(userData);
      })
      .catch(err => console.error('Error fetching carnet de routes:', err))
      .finally(() => setLoading(false));
  }, [blogSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement du carnet de routes...</p>
      </div>
    );
  }

  const totalItems = projects.length + standalonePhotos.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          📓 Carnet de Routes
        </h1>
        <div className="text-gray-600 dark:text-gray-300 font-light leading-relaxed prose dark:prose-invert max-w-none text-center">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {userProfile?.carnetIntro || "Découvrez la mémoire artistique et technique de mes sorties photo. Pour chaque projet, retrouvez l'intention initiale, les boîtiers, objectifs et pellicules utilisés, ainsi que les paramètres de prise de vue et de développement."}
          </ReactMarkdown>
        </div>
        <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full mt-4" />
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-20 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun carnet de route publié pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Project cards */}
          {projects.map(project => (
            <Link
              key={`proj-${project._id}`}
              to={`/carnet-de-routes/project/${project.slug}${s}`}
              className="group bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-md hover:shadow-xl hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="aspect-[4/3] w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                  {project.coverImage ? (
                    <img
                      src={`/uploads/${project.coverImage}`}
                      alt={project.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                      📷
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  {/* Badge projet */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full">
                    Projet
                  </span>
                </div>
                {/* Card details */}
                <div className="p-6 space-y-3">
                  <h2 className="text-xl font-bold text-gray-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
                    {project.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-light line-clamp-3 leading-relaxed">
                    {project.description || 'Aucune description disponible pour ce projet.'}
                  </p>
                </div>
              </div>
              {/* Bottom footer */}
              <div className="px-6 pb-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="font-mono">
                  Publié le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold tracking-wider uppercase group-hover:translate-x-1 transition-transform duration-200">
                  Consulter &rarr;
                </span>
              </div>
            </Link>
          ))}

          {/* Standalone photo cards */}
          {standalonePhotos.map(photo => (
            <div
              key={`photo-${photo._id}`}
              onClick={() => setLightboxPhoto(photo)}
              className="group cursor-zoom-in bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-md hover:shadow-xl hover:border-purple-400/30 dark:hover:border-purple-400/30 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                  <img
                    src={`/uploads/${photo.filename}`}
                    alt={photo.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = '/uploads/Helioscope_ecran.jpg'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  {/* Badge photo */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-full">
                    Photo
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">🔍 Agrandir</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h2 className="text-xl font-bold text-gray-950 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-200">
                    {photo.title || 'Sans titre'}
                  </h2>
                  {photo.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">📍 {photo.location}</p>
                  )}
                  {photo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-light line-clamp-3 leading-relaxed">
                      {photo.description}
                    </p>
                  )}
                  {/* Mini technical badge */}
                  {(photo.gearCameraId || photo.exposureSettings?.aperture) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {photo.gearCameraId && (
                        <span className="text-[10px] bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">
                          {photo.gearCameraId.brand} {photo.gearCameraId.model}
                        </span>
                      )}
                      {photo.exposureSettings?.aperture && (
                        <span className="text-[10px] bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">
                          {photo.exposureSettings.aperture} {photo.exposureSettings.shutterSpeed && `· ${photo.exposureSettings.shutterSpeed}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] text-xs text-gray-500 dark:text-gray-400 font-mono">
                {photo.captureDate
                  ? `Prise le ${new Date(photo.captureDate).toLocaleDateString('fr-FR')}`
                  : `Ajoutée le ${new Date(photo.createdAt).toLocaleDateString('fr-FR')}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full detail panel for standalone photos */}
      {lightboxPhoto && (() => {
        const p = lightboxPhoto;
        const devSettings = (p.developmentSettings && (p.developmentSettings.developer || p.developmentSettings.time))
          ? p.developmentSettings
          : p.filmId?.developmentSettings;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setLightboxPhoto(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 text-white text-2xl font-bold bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition"
              onClick={(e) => { e.stopPropagation(); setLightboxPhoto(null); }}
            >✕</button>

            {/* Panel */}
            <div
              className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Left — Photo */}
              <div className="md:w-1/2 bg-black flex items-center justify-center min-h-[240px]">
                <img
                  src={`/uploads/${p.filename}`}
                  alt={p.title}
                  className="w-full h-full object-contain max-h-[92vh]"
                  onError={(e) => { e.currentTarget.src = '/uploads/Helioscope_ecran.jpg'; }}
                />
              </div>

              {/* Right — Detail scroll panel */}
              <div className="md:w-1/2 overflow-y-auto p-6 space-y-5 text-gray-900 dark:text-white">

                {/* Title & meta */}
                <div className="space-y-1 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                  <h2 className="text-2xl font-extrabold">{p.title || 'Sans titre'}</h2>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {p.location && <span>📍 {p.location}</span>}
                    {p.captureDate && <span>Prise le {new Date(p.captureDate).toLocaleDateString('fr-FR')}</span>}
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed mt-2">{p.description}</p>
                  )}
                </div>

                {/* Technical — Prise de vue */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    📸 Prise de vue {p.isAnalog ? '(Argentique)' : '(Numérique)'}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    {p.gearCameraId && (
                      <div>
                        <span className="text-gray-400 text-[10px] block">Boîtier</span>
                        <span className="font-semibold">{p.gearCameraId.brand} {p.gearCameraId.model}</span>
                      </div>
                    )}
                    {p.gearLensId && (
                      <div>
                        <span className="text-gray-400 text-[10px] block">Objectif</span>
                        <span className="font-semibold">{p.gearLensId.brand} {p.gearLensId.model}</span>
                      </div>
                    )}
                  </div>
                  {/* Exposure strip */}
                  {(p.exposureSettings?.aperture || p.exposureSettings?.shutterSpeed || p.exposureSettings?.iso) && (
                    <div className="flex flex-wrap gap-3 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-lg p-2 text-xs">
                      {p.exposureSettings?.aperture && (
                        <div><span className="text-[9px] text-gray-400 block">Ouverture</span><span className="font-mono font-bold">{p.exposureSettings.aperture}</span></div>
                      )}
                      {p.exposureSettings?.shutterSpeed && (
                        <div><span className="text-[9px] text-gray-400 block">Vitesse</span><span className="font-mono font-bold">{p.exposureSettings.shutterSpeed}</span></div>
                      )}
                      {p.exposureSettings?.iso && (
                        <div><span className="text-[9px] text-gray-400 block">ISO</span><span className="font-mono font-bold">{p.exposureSettings.iso}</span></div>
                      )}
                      {p.exposureSettings?.focalLength && (
                        <div><span className="text-[9px] text-gray-400 block">Focale</span><span className="font-mono font-bold">{p.exposureSettings.focalLength}</span></div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {p.exposureSettings?.filter && p.exposureSettings.filter !== 'Aucun' && (
                      <div><span className="text-gray-400 text-[10px] block">Filtre</span><span className="font-medium">{p.exposureSettings.filter}</span></div>
                    )}
                    {p.exposureSettings?.ndFilter && p.exposureSettings.ndFilter !== 'Aucun' && (
                      <div><span className="text-gray-400 text-[10px] block">Filtre ND</span><span className="font-medium">ND{p.exposureSettings.ndFilter}</span></div>
                    )}
                    {p.exposureSettings?.light && (
                      <div><span className="text-gray-400 text-[10px] block">Lumière</span><span className="font-medium">{p.exposureSettings.light}</span></div>
                    )}
                    {p.exposureSettings?.lensHood && (
                      <div><span className="text-gray-400 text-[10px] block">Parasoleil</span><span className="font-semibold text-yellow-600 dark:text-yellow-400">Oui</span></div>
                    )}
                  </div>
                </div>

                {/* Film & Development */}
                {p.isAnalog && p.filmId && (
                  <div className="space-y-2 border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                      🧪 Film & Développement
                    </h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div className="col-span-2">
                        <span className="text-gray-400 text-[10px] block">Pellicule</span>
                        <span className="font-semibold">
                          {p.filmId.brand} {p.filmId.filmType || p.filmId.name} ({p.filmId.format === 'plan-film' ? 'Plan-film 4×5' : p.filmId.format === '120' ? '120' : '35mm'})
                        </span>
                        {p.filmFrameNumber && (
                          <span className="ml-1 text-yellow-500 font-bold">
                            {p.filmId.format === 'plan-film' ? '[Plan-film]' : `[Vue #${p.filmFrameNumber}]`}
                          </span>
                        )}
                      </div>
                      {devSettings && (devSettings.developer || devSettings.time) && (
                        <>
                          <div>
                            <span className="text-gray-400 text-[10px] block">Révélateur / Dilution</span>
                            <span className="font-medium">{devSettings.developer || '—'} {devSettings.dilution ? `(${devSettings.dilution})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] block">Temps / Temp.</span>
                            <span className="font-medium font-mono">{devSettings.time || '—'} @ {devSettings.temperature || '—'}</span>
                          </div>
                          {devSettings.agitation && (
                            <div>
                              <span className="text-gray-400 text-[10px] block">Agitation</span>
                              <span className="font-medium">{devSettings.agitation}</span>
                            </div>
                          )}
                          {devSettings.pushPull && (
                            <div>
                              <span className="text-gray-400 text-[10px] block">Poussé/Retenu</span>
                              <span className="font-medium font-mono">{devSettings.pushPull}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Shooting Intent */}
                {p.shootingIntent && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">📝 Intention artistique</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic font-light leading-relaxed bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] p-2.5 rounded-xl">
                      "{p.shootingIntent}"
                    </p>
                  </div>
                )}

                {/* Making-of */}
                {p.makingOf && (
                  <div className="border-t border-purple-500/20 pt-3 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      🎬 Secret de fabrication
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-purple-50/40 dark:bg-purple-900/10 border border-purple-200/40 dark:border-purple-400/20 rounded-xl p-4 text-black dark:text-white [&_*]:text-black [&_p]:text-black [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h4]:text-black [&_h5]:text-black [&_h6]:text-black [&_strong]:text-black [&_li]:text-black dark:[&_*]:text-white dark:[&_p]:text-white dark:[&_h1]:text-white dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-white dark:[&_h5]:text-white dark:[&_h6]:text-white dark:[&_strong]:text-white dark:[&_li]:text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({ src, alt }) => (
                            <img
                              src={src}
                              alt={alt}
                              className="rounded-lg max-w-full shadow-md border border-black/10 dark:border-white/10 my-2"
                            />
                          )
                        }}
                      >
                        {p.makingOf}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CarnetDeRoutesPage;
