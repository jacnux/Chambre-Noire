import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const EditProfile = () => {
  const [bio, setBio] = useState('');
  const [portfolioIntro, setPortfolioIntro] = useState('');
  const [servicesDescription, setServicesDescription] = useState('');
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
    ? 'bg-white/5 border border-white/10'
    : 'bg-white/90 border border-gray-200 shadow-sm';
  const sectionBorderClass = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
  const inputClass = theme === 'dark'
    ? 'w-full bg-black/30 border border-white/10 p-3 rounded-lg text-white focus:ring-1 focus:ring-purple-500 outline-none'
    : 'w-full bg-gray-50 border border-gray-300 p-3 rounded-lg text-gray-900 focus:ring-1 focus:ring-purple-500 outline-none';
  const uploadInputClass = theme === 'dark'
    ? 'text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-white cursor-pointer'
    : 'text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-white cursor-pointer';
  const bannerEmptyClass = theme === 'dark'
    ? 'w-full h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700'
    : 'w-full h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 bg-gray-50';
  const avatarFallbackClass = theme === 'dark'
    ? 'w-24 h-24 rounded-full bg-purple-900 flex items-center justify-center text-3xl'
    : 'w-24 h-24 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl';

  return (
    <div className={`w-full px-4 py-6 sm:px-6 sm:py-8 ${shellTextClass}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-yellow-500 drop-shadow-lg">Mon Profil</h1>
          <Link
            to="/dashboard"
            className={`text-sm transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            ← Retour
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className={`p-6 rounded-xl space-y-6 ${panelClass}`}>
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${mutedTextClass}`}>Image de couverture (Portfolio)</label>
              <div className={`w-full h-40 rounded-lg overflow-hidden relative group ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {(bannerFile || currentBanner) ? (
                  <img
                    src={bannerFile ? URL.createObjectURL(bannerFile) : `/uploads/${currentBanner}`}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                    alt="Bannière"
                  />
                ) : (
                  <div className={bannerEmptyClass}>Cliquez pour ajouter une bannière</div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={e => setBannerFile(e.target.files ? e.target.files[0] : null)}
                className={`${uploadInputClass} file:bg-yellow-600 hover:file:bg-yellow-700`}
              />
            </div>

            <div className={`flex flex-col sm:flex-row gap-6 items-center border-t pt-6 ${sectionBorderClass}`}>
              <div className="flex-shrink-0">
                {currentAvatar || avatarFile ? (
                  <img
                    src={avatarFile ? URL.createObjectURL(avatarFile) : `/uploads/${currentAvatar}`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                    alt="Avatar"
                  />
                ) : (
                  <div className={avatarFallbackClass}>?</div>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className={`block text-sm font-medium mb-1 ${mutedTextClass}`}>Changer l'avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                  className={`${uploadInputClass} file:bg-purple-600 hover:file:bg-purple-700`}
                />
              </div>
            </div>

            <div className={`border-t pt-6 ${sectionBorderClass}`}>
              <label className={`block text-sm font-medium mb-1 ${mutedTextClass}`}>Biographie</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Présentez-vous en quelques mots..."
              />
            </div>

            <div className={`border-t pt-6 ${sectionBorderClass}`}>
              <label className={`block text-sm font-medium mb-1 ${mutedTextClass}`}>Introduction Portfolio</label>
              <textarea
                value={portfolioIntro}
                onChange={e => setPortfolioIntro(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Court texte affiché en haut de votre portfolio..."
              />
            </div>

            <div className={`border-t pt-6 ${sectionBorderClass}`}>
              <label className={`block text-sm font-medium mb-1 ${mutedTextClass}`}>Projets-Services</label>
              <textarea
                value={servicesDescription}
                onChange={e => setServicesDescription(e.target.value)}
                rows={6}
                className={inputClass}
                placeholder="Décrivez vos projets, tarifs, conditions... (Affiché dans l'onglet Services)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:scale-[1.02] transition"
          >
            Sauvegarder le profil
          </button>

          <p className={`text-sm ${subtleTextClass}`}>
            La gestion des pages a été déplacée vers le menu « Mes Pages » du Dashboard.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
