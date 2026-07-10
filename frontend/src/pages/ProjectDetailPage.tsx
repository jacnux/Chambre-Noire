import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<any | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`/api/projects/public/project/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Impossible de charger ce projet');
        return res.json();
      })
      .then(data => {
        setProject(data.project);
        setPhotos(data.photos || []);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Une erreur est survenue');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement des détails du projet...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="text-red-500 font-medium">{error || 'Projet introuvable'}</p>
        <Link to="/" className="inline-block text-amber-500 font-semibold hover:underline">
          &larr; Retour au carnet de routes
        </Link>
      </div>
    );
  }

  const isEmbedded = window.location.pathname.startsWith('/embed/');

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Back link */}
      {!isEmbedded && (
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-amber-500 transition-colors">
            &larr; Retour au carnet de routes
          </Link>
        </div>
      )}

      {/* Project Header */}
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          {project.name}
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Publié le {new Date(project.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-light text-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
        </div>
      </div>

      {/* Photos flow (Carnet de voyage style) */}
      <div className="space-y-24">
        {photos.map((photo, idx) => (
          <div key={photo._id} className="space-y-6 border-b border-black/[0.06] dark:border-white/[0.06] pb-16 last:border-b-0 last:pb-0">
            {/* Visual */}
            <div className="bg-black/5 dark:bg-white/5 rounded-3xl overflow-hidden shadow-lg aspect-[3/2] relative group">
              <img
                src={`/uploads/${photo.filename}`}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white px-2 py-0.5 rounded-full">
                {idx + 1} / {photos.length}
              </span>
            </div>

            {/* Context & Technical card */}
            <div className="grid md:grid-cols-12 gap-8 items-start">
              {/* Artistic side */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xl font-bold text-gray-950 dark:text-white">{photo.title}</h3>
                {photo.location && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    📍 {photo.location}
                    {photo.captureDate && ` • 📅 ${new Date(photo.captureDate).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
                {photo.shootingIntent && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Note artistique</span>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
                      "{photo.shootingIntent}"
                    </p>
                  </div>
                )}
                {photo.makingOf && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Secret de fabrication</span>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{photo.makingOf}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical side */}
              <div className="md:col-span-5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 space-y-5 text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                    {photo.isAnalog ? '🎞️ Fiche Argentique' : '⚡ Fiche Numérique'}
                  </span>
                </div>

                {/* Exif block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Réglages prise de vue</h4>
                  <table className="w-full text-xs text-gray-600 dark:text-gray-400">
                    <tbody>
                      {photo.gearCameraId && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Boîtier</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">{photo.gearCameraId.brand} {photo.gearCameraId.model}</td>
                        </tr>
                      )}
                      {photo.gearLensId && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Objectif</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">{photo.gearLensId.brand} {photo.gearLensId.model}</td>
                        </tr>
                      )}
                      {photo.exposureSettings?.aperture && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Ouverture</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">{photo.exposureSettings.aperture}</td>
                        </tr>
                      )}
                      {photo.exposureSettings?.shutterSpeed && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Vitesse d'obturation</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">{photo.exposureSettings.shutterSpeed}</td>
                        </tr>
                      )}
                      {(photo.exposureSettings?.iso || photo.filmId?.isoUsed || photo.filmId?.iso) && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Sensibilité</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                            {photo.exposureSettings?.iso || photo.filmId?.isoUsed || photo.filmId?.iso} ISO
                          </td>
                        </tr>
                      )}
                      {photo.exposureSettings?.focalLength && (
                        <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                          <td className="py-1.5 font-light">Focale</td>
                          <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">{photo.exposureSettings.focalLength}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Development block for Analog */}
                {photo.isAnalog && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-t border-black/[0.06] dark:border-white/[0.06] pt-3">Chimie & Labo</h4>
                    <table className="w-full text-xs text-gray-600 dark:text-gray-400">
                      <tbody>
                        {photo.filmId && (
                          <>
                            <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                              <td className="py-1.5 font-light">Pellicule</td>
                              <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                                {(() => {
                                  const brand = photo.filmId.brand || '';
                                  const type = photo.filmId.filmType || '';
                                  return type.toLowerCase().startsWith(brand.toLowerCase()) ? type : `${brand} ${type}`;
                                })()} (Nominale : {photo.filmId.iso} ISO)
                              </td>
                            </tr>
                            <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                              <td className="py-1.5 font-light">Type / Format</td>
                              <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                                {photo.filmId.type === 'BW' ? 'Noir & Blanc' : photo.filmId.type === 'color' ? 'Couleur Négatif' : 'Couleur Diapo'} • Format {photo.filmId.format}
                              </td>
                            </tr>
                          </>
                        )}
                        {(photo.developmentSettings?.developer || photo.filmId?.developmentSettings?.developer) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Révélateur</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.developer || photo.filmId?.developmentSettings?.developer}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.dilution || photo.filmId?.developmentSettings?.dilution) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Dilution</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.dilution || photo.filmId?.developmentSettings?.dilution}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.time || photo.filmId?.developmentSettings?.time) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Temps dév.</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.time || photo.filmId?.developmentSettings?.time}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.temperature || photo.filmId?.developmentSettings?.temperature) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Température</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.temperature || photo.filmId?.developmentSettings?.temperature}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.agitation || photo.filmId?.developmentSettings?.agitation) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Agitation</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.agitation || photo.filmId?.developmentSettings?.agitation}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.pushPull || photo.filmId?.developmentSettings?.pushPull) && 
                         (photo.developmentSettings?.pushPull !== 'Aucun' && photo.filmId?.developmentSettings?.pushPull !== 'Aucun') && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Push/Pull</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.pushPull || photo.filmId?.developmentSettings?.pushPull}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.fixerBrand || photo.filmId?.developmentSettings?.fixerBrand) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Fixateur</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.fixerBrand || photo.filmId?.developmentSettings?.fixerBrand}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.fixerDilution || photo.filmId?.developmentSettings?.fixerDilution) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Dilution fixateur</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.fixerDilution || photo.filmId?.developmentSettings?.fixerDilution}
                            </td>
                          </tr>
                        )}
                        {(photo.developmentSettings?.fixerTime || photo.filmId?.developmentSettings?.fixerTime) && (
                          <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                            <td className="py-1.5 font-light">Temps fixage</td>
                            <td className="py-1.5 text-right font-medium text-gray-950 dark:text-white">
                              {photo.developmentSettings?.fixerTime || photo.filmId?.developmentSettings?.fixerTime}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
