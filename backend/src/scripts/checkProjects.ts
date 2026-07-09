import mongoose from 'mongoose';
import Project from '../models/Project';
import User from '../models/User';
import Photo from '../models/Photo';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/luminaview';

const runCheck = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB.');

    const users = await User.find();
    console.log(`Utilisateurs trouvés (${users.length}) :`);
    users.forEach(u => console.log(`- ${u.name} (id: ${u._id})`));

    const projects = await Project.find();
    console.log(`\nProjets trouvés (${projects.length}) :`);
    for (const p of projects) {
      const u = users.find(usr => usr._id.toString() === p.userId.toString());
      const pPhotos = await Photo.find({ projectId: p._id });
      console.log(`- "${p.name}" | Publié: ${p.isPublished} | Par: ${u ? u.name : 'Inconnu'} | Photos associées: ${pPhotos.length} (${pPhotos.filter(ph => ph.showOnBlog).length} affichées sur le blog) | Slug: ${p.slug}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runCheck();
