import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  isPublished: boolean;
  coverImage?: string;
  makingOf?: string; // Contenu Markdown du secret de fabrication du projet
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  slug: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
  coverImage: { type: String },
  makingOf: { type: String, default: '' }
}, { timestamps: true });

// Un utilisateur ne peut pas avoir deux projets avec le même slug
ProjectSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
