import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';  // ← une seule fois
import { API_PREFIX } from '../../utils/blogApi';

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_PREFIX}/posts/${slug}`)
      .then(res => res.json())
      .then(data => { setPost(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement de l'article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">Cet article n'existe pas ou a été supprimé.</p>
        <Link to={`/${location.search}`} className="text-sm text-amber-600 dark:text-amber-400 hover:underline">Retour aux articles</Link>
      </div>
    );
  }

  // Calcul du temps de lecture estimé (200 mots par minute)
  const wordCount = post.content ? post.content.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link 
        to={`/${location.search}`} 
        className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition duration-200 mb-8"
      >
        <span className="transform group-hover:-translate-x-1 transition-transform duration-200">&larr;</span> Retour aux articles
      </Link>
      
      <article className="bg-white dark:bg-slate-900/40 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 md:p-10 shadow-sm">
        <header className="border-b border-black/[0.06] dark:border-white/[0.06] pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={post.createdAt}>
              {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
            <span>•</span>
            <span>{readingTime} min de lecture</span>
          </div>
        </header>
        
        <div className="prose dark:prose-invert max-w-none">
          <MarkdownRenderer className="prose">{post.content}</MarkdownRenderer>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;
