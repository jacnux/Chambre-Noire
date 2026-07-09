import mongoose from 'mongoose';
import Gear from '../models/Gear';
import User from '../models/User';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/luminaview';

const seedData = async () => {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB.');

    // 1. Trouver l'utilisateur (on prend "jac" ou à défaut le premier utilisateur de la base)
    let user = await User.findOne({ name: /jac/i });
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      console.error('Aucun utilisateur trouvé en base de données pour associer le matériel. Veuillez d\'abord vous inscrire.');
      process.exit(1);
    }

    console.log(`Association du matériel à l'utilisateur : ${user.name} (${user.email})`);

    const gearsToSeed = [
      // BOITIERS
      { brand: 'Sinar', model: 'F', type: 'camera' as const, format: 'Plan-film 4x5', notes: 'Chambre 4x5 technique monorail' },
      { brand: 'Rolleiflex', model: 'Rolleiflex', type: 'camera' as const, format: '120', notes: 'Bi-objectif Moyen Format' },
      { brand: 'Pentax', model: 'MX', type: 'camera' as const, format: '35mm', notes: 'Reflex argentique compact' },
      { brand: 'Sony', model: 'Alpha 7 II', type: 'camera' as const, format: 'Plein format', notes: 'Hybride numérique' },

      // OBJECTIFS ARGENTIQUES 4X5
      { brand: 'Fujinon', model: '150mm f/6,3', type: 'lens' as const, format: 'Plan-film 4x5', notes: 'Objectif standard chambre' },
      { brand: 'Schneider', model: 'Angular 90mm f/8', type: 'lens' as const, format: 'Plan-film 4x5', notes: 'Grand angle chambre' },
      { brand: 'Schneider', model: 'Symmar 180mm f/5,6', type: 'lens' as const, format: 'Plan-film 4x5', notes: 'Focale longue chambre' },
      { brand: 'Schneider', model: 'Ragonar 210 mm f/2,8', type: 'lens' as const, format: 'Plan-film 4x5', notes: 'Focale longue de studio' },

      // OBJECTIF ROLLEIFLEX
      { brand: 'Schneider', model: '75mm f/3,5', type: 'lens' as const, format: '120', notes: 'Objectif fixe Rolleiflex' },

      // OBJECTIFS PENTAX (35mm)
      { brand: 'Pentax', model: '28mm f/2,8', type: 'lens' as const, format: '35mm', notes: 'Grand angle Pentax K' },
      { brand: 'Pentax', model: '40mm f/2,8', type: 'lens' as const, format: '35mm', notes: 'Objectif pancake ultra-compact' },
      { brand: 'Pentax', model: '100mm f/2,8', type: 'lens' as const, format: '35mm', notes: 'Focale fixe portrait / macro' },
      { brand: 'Pentax', model: '135 mm f/3,5', type: 'lens' as const, format: '35mm', notes: 'Téléobjectif moyen' }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const g of gearsToSeed) {
      const exists = await Gear.findOne({
        userId: user._id,
        brand: g.brand,
        model: g.model,
        type: g.type
      });

      if (!exists) {
        const newGear = new Gear({
          userId: user._id,
          type: g.type,
          brand: g.brand,
          model: g.model,
          format: g.format,
          notes: g.notes
        });
        await newGear.save();
        createdCount++;
        console.log(`Créé : ${g.type === 'camera' ? '📷' : '🔍'} ${g.brand} ${g.model} (${g.format})`);
      } else {
        skippedCount++;
      }
    }

    console.log(`Seeding terminé. Créés : ${createdCount}, Ignorés (déjà existants) : ${skippedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur durant le seeding :', err);
    process.exit(1);
  }
};

seedData();
