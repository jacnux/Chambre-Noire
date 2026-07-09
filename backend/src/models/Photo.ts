import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  albumId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Le propriétaire
  filename: string;
  index: number;
  title: string;
  description: string;
  tags: string[];
  size?: number;
  createdAt: Date;

  // --- Carnet de route / Prise de vue ---
  projectId?: mongoose.Types.ObjectId;
  isAnalog?: boolean;
  gearCameraId?: mongoose.Types.ObjectId;
  gearLensId?: mongoose.Types.ObjectId;
  filmId?: mongoose.Types.ObjectId; // Links to a specific physical Film roll / holder
  filmFrameNumber?: number; // e.g. View #1 to #36, or Face #1 / #2
  showOnBlog?: boolean; // independent blog visibility toggle
  exposureSettings?: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    light?: string;
    filter?: string; // e.g. Aucun, Rouge, Bleu, Vert, Jaune
    ndFilter?: string; // e.g. Aucun, 1, 2, 4, 8, 16, 100
    lensHood?: boolean; // parasoleil
  };
  developmentSettings?: { // Specific override (especially for plan-film sheet development)
    developer?: string;
    dilution?: string;
    time?: string;
    temperature?: string;
    agitation?: string;
    pushPull?: string;
    fixerBrand?: string;
    fixerDilution?: string;
    fixerTime?: string;
  };
  shootingIntent?: string;
  location?: string;
  captureDate?: Date;
  makingOf?: string; // Contenu Markdown du secret de fabrication
}

const PhotoSchema = new Schema<IPhoto>({
  albumId: { type: Schema.Types.ObjectId, ref: 'Album', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  index: { type: Number, required: true, default: 0 },
  title: { type: String, required: true, default: 'Sans titre' },
  description: { type: String, default: '' },
  tags: [{ type: String }],
  size: { type: Number, default: 0 }, // Taille du fichier en octets
  createdAt: { type: Date, default: Date.now },

  // --- Nouveaux attributs ---
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
  isAnalog: { type: Boolean, default: false },
  gearCameraId: { type: Schema.Types.ObjectId, ref: 'Gear', default: null },
  gearLensId: { type: Schema.Types.ObjectId, ref: 'Gear', default: null },
  filmId: { type: Schema.Types.ObjectId, ref: 'Film', default: null },
  filmFrameNumber: { type: Number, default: null },
  showOnBlog: { type: Boolean, default: false },
  exposureSettings: {
    aperture: { type: String, default: '' },
    shutterSpeed: { type: String, default: '' },
    iso: { type: Number, default: null },
    focalLength: { type: String, default: '' },
    light: { type: String, default: '' },
    filter: { type: String, default: 'Aucun' },
    ndFilter: { type: String, default: 'Aucun' },
    lensHood: { type: Boolean, default: false }
  },
  developmentSettings: { // Reste comme surcharge optionnelle
    developer: { type: String, default: '' },
    dilution: { type: String, default: '' },
    time: { type: String, default: '' },
    temperature: { type: String, default: '' },
    agitation: { type: String, default: '' },
    pushPull: { type: String, default: '' },
    fixerBrand: { type: String, default: '' },
    fixerDilution: { type: String, default: '' },
    fixerTime: { type: String, default: '' }
  },
  shootingIntent: { type: String, default: '' },
  location: { type: String, default: '' },
  captureDate: { type: Date, default: null },
  makingOf: { type: String, default: '' }
});


export default mongoose.model<IPhoto>('Photo', PhotoSchema);
