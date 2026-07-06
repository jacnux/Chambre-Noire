import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

const BlogManager = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const { user } = useAuth();

  // --- CORRECTION ICI : Définition de blogSlug ---
  const blogSlug = user?.name?.toLowerCase() || 'unknown';
  // -----------------------------------------------

  // NOUVEAU : Fonction pour calculer l'URL publique du blog
  const getBlogPublicUrl = () => {
     const slug = blogSlug.toLowerCase(); // Utilise la variable définie ci-dessus
     if (window.location.hostname === 'localhost') {
       return `http://localhost:8080/?user=${slug}`;
     }
     // Nouveau format : jac-blog.helioscope.fr
     return `https://${slug}-blog.helioscope.fr`;
   };

  const blogUrl = getBlogPublicUrl();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/blog/posts?blog=${blogSlug}`);
      setPosts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Ajout de blogSlug dans les dépendances pour être propre
    if (blogSlug && blogSlug !== 'unknown') {
        fetchPosts();
    }
  }, [blogSlug]);

  const handleEdit = (post: any) => {
    setEditId(post._id);
    setTitle(post.title);
    setContent(post.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert("Remplissez tous les champs");

    try {
      const postSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

      if (editId) {
        await api.put(`/blog/posts/${editId}`, { title, content, slug: postSlug, blogSlug });
        alert("Article mis à jour !");
      } else {
        await api.post('/blog/posts', { title, content, slug: postSlug, blogSlug });
        alert("Article publié !");
      }

      setTitle('');
      setContent('');
      setEditId(null);
      fetchPosts();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Supprimer cet article ?")) return;
    try {
      await api.delete(`/blog/posts/${id}`);
      fetchPosts();
    } catch (err) {
      alert("Erreur suppression");
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('blog-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      setContent(prev => prev + before + after);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const replacement = before + (selection || '') + after;
    setContent(content.substring(0, start) + replacement + content.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selection || '').length);
    }, 50);
  };

  return (
    <div className="space-y-8 px-4 py-8 sm:px-8 sm:py-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-5 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Gestion du Blog</h1>
          {/* Public Address */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Adresse publique :</span>
            <a
              href={blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-yellow-500 hover:text-yellow-400 hover:underline transition"
            >
              {blogUrl}
            </a>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          ← Dashboard
        </Link>
      </div>

      {/* --- GRID LAYOUT --- */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* COLONNE GAUCHE : EDITEUR PRESTIGE (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editeur Style Notebook */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4">
            
            {/* Barre d'outils Markdown */}
            <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-white/5">
              <button
                type="button"
                onClick={() => insertText('**', '**')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold transition flex items-center justify-center"
                title="Gras"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertText('*', '*')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs italic transition flex items-center justify-center"
                title="Italique"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertText('\n> ')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition flex items-center justify-center"
                title="Citation"
              >
                ”
              </button>
              <button
                type="button"
                onClick={() => insertText('[', '](url)')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition flex items-center justify-center"
                title="Lien"
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => insertText('![Image](/uploads/', '.jpg)')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition flex items-center justify-center"
                title="Image"
              >
                🖼️
              </button>
              <button
                type="button"
                onClick={() => insertText('\n```\n', '\n```\n')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition flex items-center justify-center font-mono"
                title="Code"
              >
                &lt;/&gt;
              </button>
              <button
                type="button"
                onClick={() => insertText('\n- ')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition flex items-center justify-center"
                title="Liste à puces"
              >
                •
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-extrabold text-white border-none focus:outline-none focus:ring-0 placeholder-gray-800 pb-2"
                placeholder="Titre de votre histoire..."
              />

              <textarea
                id="blog-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-transparent border-none text-gray-300 font-mono text-base leading-relaxed focus:outline-none focus:ring-0 placeholder-gray-700 min-h-[450px] resize-y"
                placeholder="Écrivez votre récit ici. Utilisez le format Markdown pour insérer des images et formater vos textes..."
              />

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-yellow-500/10 active:scale-[0.99]"
                >
                  {editId ? "Mettre à jour l'article" : "Publier l'article"}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => { setEditId(null); setTitle(''); setContent(''); }}
                    className="px-6 py-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-xl text-sm transition"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE : APERÇU + LISTE (2/5) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Aperçu en temps réel */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider flex items-center gap-2 uppercase">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
              Aperçu en temps réel
            </h3>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 border-t border-white/5 pt-4">
              {title ? (
                <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h1>
              ) : (
                <p className="text-gray-700 italic">Le titre de l'article s'affichera ici...</p>
              )}
              <div className="overflow-hidden prose-p:my-2 prose-headings:text-white prose-a:text-yellow-500 leading-relaxed font-serif text-sm">
                <MarkdownRenderer>
                  {content || "*Commencez à rédiger votre contenu pour voir un aperçu en direct.*"}
                </MarkdownRenderer>
              </div>
            </div>
          </div>

          {/* Liste des articles existants */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight">Articles publiés</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <p className="text-gray-500 text-sm">Chargement des articles...</p>
              ) : (
                <>
                  {posts.length === 0 && (
                    <p className="text-gray-600 text-sm italic">Aucun article n'a encore été écrit.</p>
                  )}

                  {posts.map(post => (
                    <div
                      key={post._id}
                      className="bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:border-yellow-500/20 hover:bg-white/[0.04] transition duration-200 group flex justify-between items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-200 truncate text-sm leading-snug">{post.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-xs bg-white/5 hover:bg-yellow-500 hover:text-black text-yellow-500 px-3 py-1.5 rounded-lg transition"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(post._id)}
                          className="text-xs bg-white/5 hover:bg-red-600/20 text-red-400 hover:text-white px-2 py-1.5 rounded-lg transition"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogManager;
