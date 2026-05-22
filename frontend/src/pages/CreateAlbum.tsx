import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CreateAlbum = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isVirtual, setIsVirtual] = useState(false);

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [includedTags, setIncludedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get('/photos/tags');
        setAvailableTags(res.data);
      } catch (err) {
        console.error("Erreur chargement tags", err);
      }
    };
    fetchTags();
  }, []);

  const handleTagClick = (tag: string) => {
    const isIncluded = includedTags.includes(tag);
    const isExcluded = excludedTags.includes(tag);

    if (!isIncluded && !isExcluded) {
      setIncludedTags([...includedTags, tag]);
    } else if (isIncluded) {
      setIncludedTags(includedTags.filter(t => t !== tag));
      setExcludedTags([...excludedTags, tag]);
    } else {
      setExcludedTags(excludedTags.filter(t => t !== tag));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CORRECTION BUG : Validation — une galerie virtuelle doit avoir au moins 1 tag inclus
    if (isVirtual && includedTags.length === 0) {
      alert("Une galerie virtuelle doit avoir au moins un tag inclus (en vert).");
      return;
    }

    try {
      const data: any = {
        title,
        description,
        isPublic,
        // CORRECTION BUG : On force le booléen strict, pas de valeur ambiguë
        isVirtual: isVirtual === true,
        virtualFilter: null,
        filterValue: null
      };

      if (isVirtual) {
        const excludedWithDash = excludedTags.map(t => `-${t}`);
        // CORRECTION BUG : toLowerCase() ici pour correspondre aux tags en base
        const filterValue = [...includedTags, ...excludedWithDash]
          .map(t => t.toLowerCase().trim())
          .join(',');

        data.virtualFilter = 'tag';
        data.filterValue = filterValue;
      }

      const res = await api.post('/albums', data);
      navigate(`/album/${res.data._id}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 transition">← Retour</button>

        <h1 className="text-3xl font-bold text-yellow-400 mb-8">
          {isVirtual ? 'Nouvelle Galerie Virtuelle' : 'Nouvel Album'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 p-3 rounded-lg h-24 border border-white/10"
            />
          </div>

          <div className="flex flex-col gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5 rounded" />
              <span>Album Public</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isVirtual} onChange={(e) => {
                setIsVirtual(e.target.checked);
                // Reset tags quand on bascule le mode
                if (!e.target.checked) {
                  setIncludedTags([]);
                  setExcludedTags([]);
                }
              }} className="w-5 h-5 rounded" />
              <div>
                <span>Est une Galerie (Virtuelle)</span>
                <p className="text-xs text-gray-500 mt-1">Remplissage automatique par tags.</p>
              </div>
            </label>

            {isVirtual && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="block text-sm font-bold text-purple-300 mb-1">
                  Tags de recherche
                </label>
                {/* CORRECTION BUG : Avertissement si aucun tag inclus */}
                {includedTags.length === 0 && (
                  <p className="text-xs text-yellow-400 mb-2">⚠️ Sélectionnez au moins un tag vert (inclus) pour filtrer les photos.</p>
                )}

                <div className="flex gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-600"></span> Neutre</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Inclus</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Exclu</span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-black/20 rounded-lg max-h-40 overflow-y-auto">
                  {availableTags.length === 0 && (
                    <p className="text-gray-500 text-sm italic">Aucun tag trouvé. Ajoutez des tags à vos photos.</p>
                  )}
                  {availableTags.map(tag => {
                    const isIncluded = includedTags.includes(tag);
                    const isExcluded = excludedTags.includes(tag);

                    let classes = "px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition border ";
                    if (isIncluded) {
                      classes += "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20";
                    } else if (isExcluded) {
                      classes += "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20";
                    } else {
                      classes += "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600";
                    }

                    return (
                      <button type="button" key={tag} onClick={() => handleTagClick(tag)} className={classes}>
                        {isExcluded && '− '}{tag}
                      </button>
                    );
                  })}
                </div>

                {/* Résumé des tags sélectionnés */}
                {(includedTags.length > 0 || excludedTags.length > 0) && (
                  <div className="mt-2 text-xs text-gray-400">
                    {includedTags.length > 0 && <p>✅ Inclus : {includedTags.join(', ')}</p>}
                    {excludedTags.length > 0 && <p>❌ Exclus : {excludedTags.join(', ')}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isVirtual && includedTags.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Créer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbum;
