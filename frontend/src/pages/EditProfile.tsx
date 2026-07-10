import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const EditProfile = () => {
  const [carnetIntro, setCarnetIntro] = useState('');
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
      setCarnetIntro(profileRes.data.carnetIntro || '');
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
      formData.append('carnetIntro', carnetIntro);
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
            <p className="text-xs text-gray-500 mt-1">Personnalisez votre identité visuelle et l'introduction de votre carnet de routes.</p>
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
            {/* COLONNE GAUCHE (40%) : VISUELS */}
            <div className="lg:col-span-4 space-y-8">
              {/* CARD 1 : VISUELS */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Identité Visuelle
                </h3>

                {/* Bannière de Couverture */}
                <div className="space-y-3">
                  <label className={labelClass}>Image de couverture (Bannière du Carnet)</label>
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
            </div>

            {/* COLONNE DROITE (60%) : INTRODUCTION DU CARNET DE ROUTE */}
            <div className="lg:col-span-6 space-y-8">
              {/* CARD 2 : IDENTITÉ & TEXTES */}
              <div className={`p-6 sm:p-8 rounded-2xl space-y-6 ${panelClass}`}>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-yellow-500">✦</span> Présentation du Carnet
                </h3>

                <div>
                  <label className={labelClass}>Introduction du Carnet de Routes (4 lignes visibles - Markdown supporté)</label>
                  <textarea
                    value={carnetIntro}
                    onChange={e => setCarnetIntro(e.target.value)}
                    rows={6}
                    className={inputClass}
                    placeholder="Saisissez un message d'introduction pour les visiteurs de votre carnet de routes..."
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
              Vos modifications sont publiées instantanément sur votre carnet de routes public.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
