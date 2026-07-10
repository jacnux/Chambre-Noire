import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CarnetDeRoutesPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [standalonePhotos, setStandalonePhotos] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch('/api/projects/public/all').then(r => r.json()),
      fetch('/api/photos/public/standalone').then(r => r.json()),
      fetch('/api/users/public/profile').then(r => r.json()).catch(() => null),
    ])
      .then(([projData, photoData, userData]) => {
        setProjects(Array.isArray(projData) ? projData : []);
        setStandalonePhotos(Array.isArray(photoData) ? photoData : []);
        setUserProfile(userData);
      })
      .catch(err => console.error('Error fetching carnet de routes:', err))
      .finally(() => setLoading(false));
  }, []);

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
              to={`/project/${project.slug}`}
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
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Publié le {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <span className="inline-flex items-center text-xs font-semibold text-amber-500 group-hover:translate-x-1 transition-transform">
                  Ouvrir le carnet de route &rarr;
                </span>
              </div>
            </Link>
          ))}

          {/* Standalone Photos */}
          {standalonePhotos.map(photo => (
            <div
              key={`photo-${photo._id}`}
              onClick={() => setLightboxPhoto(photo)}
              className="group bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-md hover:shadow-xl hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Photo container */}
                <div className="aspect-[4/3] w-full bg-black/5 dark:bg-white/5 relative overflow-hidden">
                  <img
                    src={`/uploads/${photo.filename}`}
                    alt={photo.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  {/* Badge analogique / numérique */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/75 text-white px-2 py-0.5 rounded-full">
                    {photo.isAnalog ? '🎞️ Argentique' : '⚡ Numérique'}
                  </span>
                </div>
                {/* Photo details */}
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {photo.title}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {photo.location ? `📍 ${photo.location}` : ''}
                    {photo.captureDate ? ` • 📅 ${new Date(photo.captureDate).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  {photo.shootingIntent && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed italic">
                      "{photo.shootingIntent}"
                    </p>
                  )}
                </div>
              </div>
              <div className="p-5 pt-0">
                <span className="inline-flex items-center text-xs font-semibold text-amber-500">
                  Afficher la fiche technique &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for Standalone Photo Detail */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-gray-950 border border-white/10 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* Left: Image */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:max-h-[90vh]">
              <img
                src={`/uploads/${lightboxPhoto.filename}`}
                alt={lightboxPhoto.title}
                className="max-w-full max-h-[40vh] md:max-h-[90vh] object-contain"
              />
            </div>

            {/* Right: Technical Metadata Info */}
            <div className="w-full md:w-80 p-6 overflow-y-auto space-y-6 border-t md:border-t-0 md:border-l border-white/10 text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  {lightboxPhoto.isAnalog ? '🎞️ Argentique' : '⚡ Numérique'}
                </span>
                <h2 className="text-xl font-bold mt-2">{lightboxPhoto.title}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {lightboxPhoto.location && `📍 ${lightboxPhoto.location}`}
                  {lightboxPhoto.captureDate && ` • 📅 ${new Date(lightboxPhoto.captureDate).toLocaleDateString('fr-FR')}`}
                </p>
              </div>

              {lightboxPhoto.shootingIntent && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500">Intention</h4>
                  <p className="text-sm text-gray-300 leading-relaxed italic">"{lightboxPhoto.shootingIntent}"</p>
                </div>
              )}

              {/* Technical block */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500 border-b border-white/10 pb-1">Prise de vue</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {lightboxPhoto.gearCameraId && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 block">Appareil</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.gearCameraId.brand} {lightboxPhoto.gearCameraId.model}</span>
                    </div>
                  )}
                  {lightboxPhoto.gearLensId && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 block">Objectif</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.gearLensId.brand} {lightboxPhoto.gearLensId.model}</span>
                    </div>
                  )}
                  {lightboxPhoto.exposureSettings?.aperture && (
                    <div>
                      <span className="text-xs text-gray-500 block">Ouverture</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.exposureSettings.aperture}</span>
                    </div>
                  )}
                  {lightboxPhoto.exposureSettings?.shutterSpeed && (
                    <div>
                      <span className="text-xs text-gray-500 block">Vitesse</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.exposureSettings.shutterSpeed}</span>
                    </div>
                  )}
                  {lightboxPhoto.exposureSettings?.iso && (
                    <div>
                      <span className="text-xs text-gray-500 block">Sensibilité</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.exposureSettings.iso} ISO</span>
                    </div>
                  )}
                  {lightboxPhoto.exposureSettings?.focalLength && (
                    <div>
                      <span className="text-xs text-gray-500 block">Focale</span>
                      <span className="font-medium text-gray-200">{lightboxPhoto.exposureSettings.focalLength}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chemical block for analog */}
              {lightboxPhoto.isAnalog && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500 border-b border-white/10 pb-1">Chimie & Labo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {lightboxPhoto.filmId && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 block">Pellicule</span>
                        <span className="font-medium text-gray-200">
                          {lightboxPhoto.filmId.brand} {lightboxPhoto.filmId.filmType} (Nominale : {lightboxPhoto.filmId.iso} ISO)
                          <span className="text-xs text-gray-400 block mt-0.5">
                            Type : {lightboxPhoto.filmId.type === 'BW' ? 'Noir & Blanc' : lightboxPhoto.filmId.type === 'color' ? 'Couleur Négatif' : 'Couleur Diapo'} • Format : {lightboxPhoto.filmId.format}
                          </span>
                        </span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.developer && (
                      <div>
                        <span className="text-xs text-gray-500 block">Révélateur</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.developer}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.dilution && (
                      <div>
                        <span className="text-xs text-gray-500 block">Dilution</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.dilution}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.time && (
                      <div>
                        <span className="text-xs text-gray-500 block">Temps dév.</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.time}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.temperature && (
                      <div>
                        <span className="text-xs text-gray-500 block">Température</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.temperature}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.pushPull && lightboxPhoto.developmentSettings.pushPull !== 'Aucun' && (
                      <div>
                        <span className="text-xs text-gray-500 block">Push/Pull</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.pushPull}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.fixerBrand && (
                      <div>
                        <span className="text-xs text-gray-500 block">Fixateur</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.fixerBrand}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.fixerDilution && (
                      <div>
                        <span className="text-xs text-gray-500 block">Dilution fixateur</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.fixerDilution}</span>
                      </div>
                    )}
                    {lightboxPhoto.developmentSettings?.fixerTime && (
                      <div>
                        <span className="text-xs text-gray-500 block">Temps fixage</span>
                        <span className="font-medium text-gray-200">{lightboxPhoto.developmentSettings.fixerTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarnetDeRoutesPage;
