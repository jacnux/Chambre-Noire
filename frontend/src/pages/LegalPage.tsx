import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LegalPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const isExternal = from && (from.startsWith('http://') || from.startsWith('https://'));

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8 border-b border-white/10 pb-4">Mentions Légales & CGU</h1>

        {/* Section 1 : Editeur */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">1. Éditeur du service</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Le site Hélioscope est édité par :<br/>
            <strong>[Jac / Luminaview]</strong><br/>
            Contact : <a href="mailto:helioscope@proton.me" className="text-blue-400 hover:underline">helioscope@proton.me</a>
          </p>
        </section>

        {/* Section 2 : CGU */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">2. Conditions Générales d'Utilisation (CGU)</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            En utilisant Hélioscope, vous acceptez les conditions suivantes :
          </p>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-2">
            <li>Les utilisateurs s'engagent à ne pas publier de contenu illégal, diffamatoire ou portant atteinte aux droits des tiers.</li>
            <li>L'utilisateur conserve la propriété de ses images, mais autorise Hélioscope à les afficher dans le cadre du service.</li>
            <li>L'hébergeur se réserve le droit de supprimer tout contenu signalé comme illicite sans préavis (Loi LCEN 2004).</li>
            <li>Le service est fourni "en l'état" sans garantie de disponibilité permanente.</li>
          </ul>
        </section>

        {/* Section 3 : Signalement */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">3. Signalement de contenu illicite</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Conformément à la loi, vous pouvez signaler tout contenu illicite via le bouton "Signaler" présent sur chaque page ou en nous contactant directement à l'adresse : <strong>autofinancement.jac@gmail.com</strong>.
          </p>
        </section>

        {/* Section 4 : Défenseur des droits */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">4. Défenseur des droits</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Conformément à l'article 6-I de la loi n°2004-575 du 21 juin 2004, nous vous informons que vous avez le droit de saisir le Défenseur des droits si vous estimez que vos droits ne sont pas respectés.<br/>
            <a href="https://www.defenseurdesdroits.fr" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">www.defenseurdesdroits.fr</a>
          </p>
        </section>

        <div className="text-center mt-8 border-t border-white/10 pt-4">
          {isExternal ? (
            <a href={from!} className="text-sm text-gray-400 hover:text-white">← Retour au blog</a>
          ) : (
            <Link to="/" className="text-sm text-gray-400 hover:text-white">← Retour à l'accueil</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
