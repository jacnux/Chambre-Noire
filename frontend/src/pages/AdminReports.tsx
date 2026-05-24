import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (user?.isAdmin) fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    if (!window.confirm('Marquer ce signalement comme traité ?')) return;
    await api.patch(`/reports/${id}/resolve`);
    fetchReports();
  };

  const getLink = (report: any) => {
    if (!report.targetDetails) return '#';

    if (report.type === 'user_page') {
      const username = report.targetDetails.userId?.name;
      const slug = report.targetDetails.slug;
      if (!username || !slug) return '#';
      return `/portfolio/${username}/${slug}`;
    }

    if (report.type === 'album') {
      return `/album/${report.targetDetails._id}?mode=viewer`;
    }

    return '#';
  };

  const shellTextClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const subtleTextClass = theme === 'dark' ? 'text-gray-500' : 'text-gray-500';
  const cardClass = theme === 'dark'
    ? 'bg-gray-900/70 border border-red-500/20 backdrop-blur-xl'
    : 'bg-white/90 border border-red-200 shadow-sm';
  const quoteClass = theme === 'dark'
    ? 'text-gray-300 bg-black/20'
    : 'text-gray-700 bg-gray-100';

  if (!user?.isAdmin) {
    return <div className="p-8 text-red-500 text-center">Accès interdit</div>;
  }

  return (
    <div className={`w-full px-4 py-6 sm:px-6 sm:py-8 ${shellTextClass}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-red-500">
            🚩 Signalements en attente ({reports.length})
          </h1>
          <Link
            to="/dashboard"
            className={`text-sm transition ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            ← Retour
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className={`text-center py-20 ${subtleTextClass}`}>Aucun signalement en attente.</div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r._id} className={`rounded-lg p-4 ${cardClass}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase font-bold">
                        {r.type}
                      </span>
                      {r.targetDetails ? (
                        <span className="font-bold truncate">{r.targetDetails.title}</span>
                      ) : (
                        <span className="italic text-sm text-gray-500">Contenu supprimé</span>
                      )}
                    </div>

                    <p className={`text-sm mb-2 p-2 rounded italic ${quoteClass}`}>
                      "{r.reason}"
                    </p>

                    {r.targetDetails && (
                      <div className={`text-xs space-y-1 ${mutedTextClass}`}>
                        <p>
                          Propriétaire :{' '}
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                            {r.targetDetails.userId?.name || 'Inconnu'}
                          </span>{' '}
                          ({r.targetDetails.userId?.email})
                        </p>
                        <p>Signalé le : {new Date(r.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 justify-center min-w-[160px]">
                    {r.targetDetails && (
                      <a
                        href={getLink(r)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-bold transition"
                      >
                        Voir le contenu
                      </a>
                    )}
                    <button
                      onClick={() => handleResolve(r._id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold transition"
                    >
                      ✓ Marquer résolu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
