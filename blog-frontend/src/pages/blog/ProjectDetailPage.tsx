import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX } from '../../utils/blogApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ project: any; photos: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<any | null>(null);
  const location = useLocation();
  const blogSlug = getBlogSlug(location.search);
  const s = location.search;

  useEffect(() => {
    if (!slug || !blogSlug) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams(location.search);
    const preview = params.get('preview');
    const previewParam = preview ? `&preview=${preview}` : '';

    fetch(`${API_PREFIX}/projects/${slug}?blog=${blogSlug}${previewParam}`)
      .then(res => {
        if (!res.ok) throw new Error('Projet introuvable ou non publié');
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error(err);
        setError(err.message || 'Impossible de charger les détails du projet.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, blogSlug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement du projet...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="text-red-500 text-4xl">⚠️</div>
        <p className="text-gray-800 dark:text-gray-200 font-semibold">{error || 'Projet introuvable.'}</p>
        <Link
          to={`/carnet-de-routes${s}`}
          className="inline-block text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
        >
          &larr; Retour au carnet de routes
        </Link>
      </div>
    );
  }

  const { project, photos } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      {/* Back link */}
      <div>
        <Link
          to={`/carnet-de-routes${s}`}
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition duration-200"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">&larr;</span> Retour au carnet de routes
        </Link>
      </div>

      {/* Project Banner & Intent */}
      <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-8 md:p-12 space-y-6 relative overflow-hidden">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            PROJET PHOTOGRAPHIQUE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            {project.name}
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {project.description && (
          <div className="relative border-l-4 border-amber-500 pl-6 mt-4">
            <span className="absolute -left-1 -top-4 text-6xl text-amber-500/10 pointer-events-none select-none">“</span>
            <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed italic text-lg whitespace-pre-line">
              {project.description}
            </p>
          </div>
        )}

        {project.makingOf && (
          <div className="space-y-3 pt-6 border-t border-purple-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              🎬 Secret de fabrication du projet
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none bg-purple-50/40 dark:bg-purple-900/10 border border-purple-200/40 dark:border-purple-400/20 rounded-xl p-6 text-black dark:text-white [&_*]:text-black [&_p]:text-black [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h4]:text-black [&_h5]:text-black [&_h6]:text-black [&_strong]:text-black [&_li]:text-black dark:[&_*]:text-white dark:[&_p]:text-white dark:[&_h1]:text-white dark:[&_h2]:text-white dark:[&_h3]:text-white dark:[&_h4]:text-white dark:[&_h5]:text-white dark:[&_h6]:text-white dark:[&_strong]:text-white dark:[&_li]:text-white">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="rounded-xl max-w-full shadow-md border border-black/10 dark:border-white/10 my-3 mx-auto"
                    />
                  )
                }}
              >
                {project.makingOf}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Photos List (Vertical scrolling travelbook style) */}
      <div className="space-y-12">
        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune photo dans ce projet pour le moment.</div>
        ) : (
          photos.map((photo, indexIdx) => (
            <div
              key={photo._id}
              className="flex flex-col md:flex-row gap-6 items-start bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] p-6 rounded-3xl shadow-sm transition hover:shadow-md"
            >
              {/* Left Column: Vignette (Thumbnail) */}
              <div className="w-full md:w-[220px] flex-shrink-0 space-y-2">
                <div 
                  onClick={() => setActiveLightboxPhoto(photo)}
                  className="group relative bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden shadow border border-black/[0.06] dark:border-white/[0.06] aspect-square cursor-pointer"
                >
                  <img
                    src={`/uploads/${photo.filename}`}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/uploads/Helioscope_ecran.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">🔍 Agrandir</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-mono">
                  <span>Photo #{indexIdx + 1}</span>
                  {photo.location && <span className="truncate max-w-[120px]" title={photo.location}>📍 {photo.location}</span>}
                </div>
              </div>

              {/* Right Column: Title, description, and technical specs */}
              <div className="flex-1 space-y-4 w-full">
                {/* Title & Metadata Header */}
                <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                  <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                    {photo.title || 'Sans titre'}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                    {photo.location && <span>Lieu: {photo.location}</span>}
                    {photo.location && photo.captureDate && <span>|</span>}
                    {photo.captureDate && (
                      <span>Prise le {new Date(photo.captureDate).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                  {photo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-light leading-relaxed">
                      {photo.description}
                    </p>
                  )}
                </div>

                {/* Technical Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prise de vue */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      📸 Prise de vue {photo.isAnalog ? '(Argentique)' : '(Numérique)'}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Boîtier</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {photo.gearCameraId
                            ? `${photo.gearCameraId.brand} ${photo.gearCameraId.model}`
                            : 'Non spécifié'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Objectif</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {photo.gearLensId
                            ? `${photo.gearLensId.brand} ${photo.gearLensId.model}`
                            : 'Non spécifié'}
                        </span>
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-3 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] rounded-lg p-2 mt-1">
                        <div>
                          <span className="text-[9px] text-gray-400 block">Ouverture</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {photo.exposureSettings?.aperture || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Vitesse</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {photo.exposureSettings?.shutterSpeed || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Sensibilité</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {photo.exposureSettings?.iso ? `${photo.exposureSettings.iso} ISO` : '—'}
                          </span>
                        </div>
                        {photo.exposureSettings?.focalLength && (
                          <div>
                            <span className="text-[9px] text-gray-400 block">Focale</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {photo.exposureSettings.focalLength}
                            </span>
                          </div>
                        )}
                      </div>

                      {photo.exposureSettings?.light && (
                        <div>
                          <span className="text-gray-400 text-[10px] block">Éclairage</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {photo.exposureSettings.light}
                          </span>
                        </div>
                      )}

                      {photo.exposureSettings?.filter && photo.exposureSettings.filter !== 'Aucun' && (
                        <div>
                          <span className="text-gray-400 text-[10px] block">Filtre</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {photo.exposureSettings.filter}
                          </span>
                        </div>
                      )}

                      {photo.exposureSettings?.ndFilter && photo.exposureSettings.ndFilter !== 'Aucun' && (
                        <div>
                          <span className="text-gray-400 text-[10px] block">Filtre ND</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ND{photo.exposureSettings.ndFilter}
                          </span>
                        </div>
                      )}

                      {photo.exposureSettings?.lensHood && (
                        <div>
                          <span className="text-gray-400 text-[10px] block">Parasoleil</span>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                            Oui
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Film & Développement */}
                  {photo.isAnalog && (() => {
                    const devSettings = (photo.developmentSettings && (photo.developmentSettings.developer || photo.developmentSettings.time))
                      ? photo.developmentSettings
                      : photo.filmId?.developmentSettings;

                    return (
                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-black/[0.06] dark:border-white/[0.06] pt-3 md:pt-0 md:pl-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-500">
                          🧪 Film & Développement
                        </h4>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                          <div className="col-span-2">
                            <span className="text-gray-400 text-[10px] block">Pellicule</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {photo.filmId
                                ? `${photo.filmId.brand} ${photo.filmId.filmType || photo.filmId.name} (${
                                    photo.filmId.format === 'plan-film' ? 'Plan-film 4x5' : photo.filmId.format === '120' ? '120' : '35mm'
                                  })`
                                : 'Non spécifiée'}
                              {photo.filmFrameNumber && (
                                <span className="text-yellow-500 ml-1 font-bold">
                                  {photo.filmId?.format === 'plan-film' ? '[Plan-film]' : `[Vue #${photo.filmFrameNumber}]`}
                                </span>
                              )}
                            </span>
                          </div>
                          {devSettings && (devSettings.developer || devSettings.time) ? (
                            <>
                              <div>
                                <span className="text-gray-400 text-[10px] block">Révélateur / Dilution</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {devSettings.developer || '—'} {devSettings.dilution ? `(${devSettings.dilution})` : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px] block">Temps / Temp.</span>
                                <span className="font-medium text-gray-900 dark:text-white font-mono">
                                  {devSettings.time || '—'} @ {devSettings.temperature || '—'}
                                </span>
                              </div>
                              {devSettings.agitation && (
                                <div>
                                  <span className="text-gray-400 text-[10px] block">Agitation</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {devSettings.agitation}
                                  </span>
                                </div>
                              )}
                              {devSettings.pushPull && (
                                <div>
                                  <span className="text-gray-400 text-[10px] block">Poussé/Retenu</span>
                                  <span className="font-medium text-gray-900 dark:text-white font-mono">
                                    {devSettings.pushPull}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="col-span-2 text-gray-500 italic text-[11px]">
                              Aucun paramètre de développement enregistré.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Shooting Intent Note */}
                {photo.shootingIntent && (
                  <div className="space-y-1 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-xs">
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">📝 Intention artistique / Note de terrain</span>
                    <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed italic bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.03] p-2.5 rounded-xl">
                      "{photo.shootingIntent}"
                    </p>
                  </div>
                )}

                {/* Secret de fabrication */}
                {photo.makingOf && (
                  <div className="space-y-2 pt-3 border-t border-purple-500/20">
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
                        {photo.makingOf}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center transition"
            onClick={(e) => { e.stopPropagation(); setActiveLightboxPhoto(null); }}
          >
            ✕
          </button>
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center space-y-3" onClick={e => e.stopPropagation()}>
            <img 
              src={`/uploads/${activeLightboxPhoto.filename}`} 
              alt={activeLightboxPhoto.title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onError={(e) => {
                e.currentTarget.src = "/uploads/Helioscope_ecran.jpg";
              }}
            />
            <div className="text-center text-white space-y-1">
              <h3 className="font-bold text-xl">{activeLightboxPhoto.title || 'Sans titre'}</h3>
              <div className="flex justify-center gap-4 text-xs text-gray-400">
                {activeLightboxPhoto.location && <span>📍 {activeLightboxPhoto.location}</span>}
                {activeLightboxPhoto.captureDate && (
                  <span>Prise le {new Date(activeLightboxPhoto.captureDate).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
              {activeLightboxPhoto.description && (
                <p className="text-xs text-gray-300 font-light max-w-lg mx-auto italic mt-2">
                  "{activeLightboxPhoto.description}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
