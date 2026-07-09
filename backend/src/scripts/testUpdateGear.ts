import mongoose from 'mongoose';
import Gear from '../models/Gear';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/luminaview';

const runTest = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB.');

    // Trouver n'importe quel équipement
    const g = await Gear.findOne();
    if (!g) {
      console.log('Aucun matériel trouvé.');
      process.exit(0);
    }

    console.log(`Tentative de mise à jour de : ${g.brand} ${g.model} (${g._id})`);
    g.notes = (g.notes || '') + ' - test update';
    await g.save();
    console.log('Mise à jour réussie !');
    process.exit(0);
  } catch (err: any) {
    console.error('Erreur lors du test de mise à jour :', err);
    process.exit(1);
  }
};

runTest();
