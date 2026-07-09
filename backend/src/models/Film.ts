import mongoose, { Document, Schema } from 'mongoose';

export interface IFilm {
  userId: mongoose.Types.ObjectId;
  name: string; // e.g. "Tri-X #24" or "HP5 Écosse"
  brand: string; // e.g. "Kodak", "Ilford"
  filmType: string; // e.g. "Tri-X 400", "HP5 Plus"
  iso: number; // nominal ISO
  isoUsed?: number; // Sensibilité utilisée / exposée
  format: string;
  maxViews: number; // e.g. 12, 24, 36 (for rolls) or 1 (for plan-film)
  type: 'BW' | 'color' | 'slide';
  gearCameraId?: mongoose.Types.ObjectId; // Camera used for this roll
  gearLensId?: mongoose.Types.ObjectId; // Lens used for this roll (optional)
  defaultExposureSettings?: {
    aperture?: string;
    shutterSpeed?: string;
    filter?: 'Aucun' | 'Rouge' | 'Bleu' | 'Vert' | 'Jaune';
    ndFilter?: 'Aucun' | '1' | '2' | '4' | '8' | '16' | '100';
    lensHood?: boolean;
  };
  developmentSettings: {
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
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FilmSchema = new Schema<IFilm>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  filmType: { type: String, required: true },
  iso: { type: Number, required: true },
  isoUsed: { type: Number, default: null },
  format: { type: String, required: true },
  maxViews: { type: Number, required: true, default: 36 },
  type: { type: String, enum: ['BW', 'color', 'slide'], required: true },
  gearCameraId: { type: Schema.Types.ObjectId, ref: 'Gear', default: null },
  gearLensId: { type: Schema.Types.ObjectId, ref: 'Gear', default: null },
  defaultExposureSettings: {
    aperture: { type: String, default: '' },
    shutterSpeed: { type: String, default: '' },
    filter: { type: String, enum: ['Aucun', 'Rouge', 'Bleu', 'Vert', 'Jaune'], default: 'Aucun' },
    ndFilter: { type: String, enum: ['Aucun', '1', '2', '4', '8', '16', '100'], default: 'Aucun' },
    lensHood: { type: Boolean, default: false }
  },
  developmentSettings: {
    developer: { type: String, default: '' },
    dilution: { type: String, default: '' },
    time: { type: String, default: '' },
    temperature: { type: String, default: '' },
    agitation: { type: String, default: '' },
    pushPull: { type: String, default: '' },
    fixerBrand: { type: String, default: '' },
    fixerDilution: { type: String, default: '1+4' },
    fixerTime: { type: String, default: '5mn' }
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Un utilisateur ne peut pas avoir deux rouleaux de film avec le même nom
FilmSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IFilm>('Film', FilmSchema);
