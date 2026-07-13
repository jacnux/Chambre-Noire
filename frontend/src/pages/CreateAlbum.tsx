import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CreateAlbum = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data: any = {
        title,
        description,
        isPublic
      };

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
          Nouvel Album
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
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition"
          >
            Créer
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbum;
