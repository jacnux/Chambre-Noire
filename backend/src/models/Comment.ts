// src/models/Comment.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  photoId: mongoose.Types.ObjectId;
  photoOwnerId: mongoose.Types.ObjectId; // userId du photographe
  authorName: string;                    // nom du visiteur
  authorEmail?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const CommentSchema = new Schema({
  photoId:       { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  photoOwnerId:  { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  authorName:    { type: String, required: true, maxlength: 100 },
  authorEmail:   { type: String, default: '' },
  message:       { type: String, required: true, maxlength: 1000 },
  isRead:        { type: Boolean, default: false },
  createdAt:     { type: Date, default: Date.now }
});

export default mongoose.model('Comment', CommentSchema);
