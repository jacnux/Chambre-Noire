import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBlogSlug } from '../../utils/getBlogSlug';
import { API_PREFIX } from '../../utils/blogApi';

const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const location = useLocation();
  const blogSlug = getBlogSlug(location.search);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_PREFIX}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, blogSlug })
      });
      setSent(true);
    } catch {
      alert('Erreur lors de l\'envoi');
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xl font-bold">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-950 dark:text-white">Message envoyé avec succès !</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nous vous répondrons dans les plus brefs délais.</p>
        <Link 
          to={`/${location.search}`} 
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition duration-200"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">&larr;</span> Retour aux articles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white mb-8 text-center">Me contacter</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/40 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
        <div className="input-group">
          <label className="input-label text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Votre nom</label>
          <input 
            type="text" 
            required 
            className="input-field w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-950 text-gray-950 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            onChange={e => setForm({ ...form, name: e.target.value })} 
          />
        </div>
        <div className="input-group">
          <label className="input-label text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Votre email</label>
          <input 
            type="email" 
            required 
            className="input-field w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-950 text-gray-950 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            onChange={e => setForm({ ...form, email: e.target.value })} 
          />
        </div>
        <div className="input-group">
          <label className="input-label text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Message</label>
          <textarea 
            rows={5} 
            required 
            className="input-field w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-950 text-gray-950 dark:text-white focus:outline-none focus:border-amber-500 transition-colors resize-none" 
            onChange={e => setForm({ ...form, message: e.target.value })} 
          />
        </div>
        <button 
          type="submit" 
          className="w-full py-3 rounded-xl font-bold text-sm bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-amber-700 dark:hover:bg-amber-400 transition-colors shadow-sm mt-2"
        >
          Envoyer le message
        </button>
      </form>
    </div>
  );
};

export default ContactPage;
