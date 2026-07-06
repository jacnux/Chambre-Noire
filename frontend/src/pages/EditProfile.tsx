import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const EditProfile = () => {
  const [bio, setBio] = useState('');
  const [portfolioIntro, setPortfolioIntro] = useState('');
  const [servicesDescription, setServicesDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [blogTheme, setBlogTheme] = useState('classic');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string>('');
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await api.get('/users/me');
      setBio(profileRes.data.bio || '');
      setPortfolioIntro(profileRes.data.portfolioIntro || '');
      setServicesDescription(profileRes.data.servicesDescription || '');
      setTagline(profileRes.data.tagline || '');
      setBlogTheme(profileRes.data.blogTheme || 'classic');
      setCurrentAvatar(profileRes.data.avatar || '');
      setCurrentBanner(profileRes.data.bannerImage || '');
    } catch (error) {
      console.error(error);
      alert('Erreur chargement profil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('portfolioIntro', portfolioIntro);
      formData.append('servicesDescription', servicesDescription);
      formData.append('tagline', tagline);
      formData.append('blogTheme', blogTheme);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile);

      await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Profil mis à jour !');
      setBannerFile(null);
      setAvatarFile(null);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const shellTextClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const subtleTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const panelClass = theme === 'dark'
    ? 'bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-2xl'
    : 'bg-white border border-gray-100 shadow-xl shadow-gray-100/30';
  const sectionBorderClass = theme === 'dark' ? 'border-white/5' : 'border-gray-100';
  const inputClass = theme === 'dark'
    ? 'w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white placeholder-gray-600 focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition duration-200'
    : 'w-full bg-gray-50/50 border border-gray-200 p-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition duration-200';
  const labelClass = `block text-sm font-bold tracking-wide uppercase mb-2 ${mutedTextClass}`;

  return (
    <div className={`w-full px-4 py-8 sm:px-8 sm:py-12 ${shellTextClass}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Mon Profil</h1>
            <p className="text-xs text-gray-500 mt-1">Personnalisez votre identité visuelle, vos textes de présentation et votre style.</p>
          </div>
          <Link
            to="/dashboard"
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              theme === 'dark'
                ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ← Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
            {/* COLONNE GAUCHE (40%) : VISUELS & THEMES */}
            <div className="lg:col-span-4 space-y-8">
              {/* CARD 1 : VISUELS */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Identité Visuelle
                </h3>

                {/* Bannière de Couverture */}
                <div className="space-y-3">
                  <label className={labelClass}>Image de couverture (Bannière du Portfolio)</label>
                  <div className="relative group rounded-xl overflow-hidden h-44 bg-black/40 border border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-yellow-500/40">
                    {(bannerFile || currentBanner) ? (
                      <>
                        <img
                          src={bannerFile ? URL.createObjectURL(bannerFile) : `/uploads/${currentBanner}`}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition duration-300"
                          alt="Bannière"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                          <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">Changer l'image</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-sm text-gray-400 font-medium">Glisser ou cliquer pour ajouter une couverture</p>
                        <p className="text-xs text-gray-600 mt-1">Recommandé : image large (ex. 1920x1080)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setBannerFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Avatar */}
                <div className={`flex flex-col sm:flex-row gap-6 items-center border-t pt-6 ${sectionBorderClass}`}>
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 bg-black/40 flex items-center justify-center cursor-pointer hover:border-yellow-500 transition duration-300">
                    {currentAvatar || avatarFile ? (
                      <>
                        <img
                          src={avatarFile ? URL.createObjectURL(avatarFile) : `/uploads/${currentAvatar}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-70 transition duration-300"
                          alt="Avatar"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                          <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">Modifier</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-3xl text-gray-400">?</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-base">Photo de profil</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Cliquez sur le cercle pour importer votre portrait.</p>
                  </div>
                </div>
              </div>

              {/* CARD 2 : STYLE & DESIGN */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Thème Visuel
                </h3>
                
                <div className="space-y-4">
                  <label className={labelClass}>Choix de la mise en page globale</label>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      type="button"
                      onClick={() => setBlogTheme('classic')}
                      className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition duration-300 ${
                        blogTheme === 'classic'
                          ? 'border-yellow-500 bg-yellow-500/[0.04]'
                          : theme === 'dark' ? 'border-white/15 bg-black/20 hover:border-white/30' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between w-full items-center mb-2">
                        <span className="font-bold text-sm">Hélioscope (Classic)</span>
                        {blogTheme === 'classic' && <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Design clair et ambré, avec menu supérieur fluide. Idéal pour une galerie lumineuse, ouverte et épurée.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlogTheme('portfolio')}
                      className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition duration-300 ${
                        blogTheme === 'portfolio'
                          ? 'border-yellow-500 bg-yellow-500/[0.04]'
                          : theme === 'dark' ? 'border-white/15 bg-black/20 hover:border-white/30' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between w-full items-center mb-2">
                        <span className="font-bold text-sm">Artfolio</span>
                        {blogTheme === 'portfolio' && <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">Design sombre et doré, avec menu latéral fixe. Idéal pour une présentation artistique immersive et contrastée.</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE (60%) : FORMULAIRES TEXTES HAUTS */}
            <div className="lg:col-span-6 space-y-8">
              {/* CARD 3 : IDENTITÉ & TEXTES */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Informations & Textes de présentation
                </h3>

                <div>
                  <label className={labelClass}>Phrase choc (Slogan)</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className={inputClass}
                    placeholder="Ex. Capturer l'essence de l'instant..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Biographie (À propos) (8 lignes visibles)</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={8}
                    className={inputClass}
                    placeholder="Racontez votre parcours, votre passion..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Introduction du Portfolio (4 lignes visibles)</label>
                  <textarea
                    value={portfolioIntro}
                    onChange={e => setPortfolioIntro(e.target.value)}
                    rows={4}
                    className={inputClass}
                    placeholder="Un court message de bienvenue en haut de la page principale..."
                  />
                </div>
              </div>

              {/* CARD 4 : OFFRES & PRESTATIONS */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Projets & Services
                </h3>

                <div>
                  <label className={labelClass}>Description des Prestations (Markdown supporté - 12 lignes visibles)</label>
                  <textarea
                    value={servicesDescription}
                    onChange={e => setServicesDescription(e.target.value)}
                    rows={12}
                    className={inputClass}
                    placeholder="Décrivez vos offres, tarifs, séances... Ce texte est affiché dans l'onglet Services du portfolio."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-4 rounded-xl text-lg shadow-lg hover:scale-[1.01] hover:shadow-yellow-500/10 active:scale-[0.99] transition duration-200"
            >
              Enregistrer les modifications du Profil
            </button>
            <p className={`text-center text-xs mt-3 ${subtleTextClass}`}>
              Vos modifications sont publiées instantanément sur vos pages publiques.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
