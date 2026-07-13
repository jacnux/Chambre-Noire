// backend/src/models/Album.ts
import mongoose from 'mongoose';

const AlbumSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  isPublic: { type: Boolean, default: true },

  // --- NOUVEAU : Pour le Portfolio ---
  isFeatured: { type: Boolean, default: false },
  coverImage: String, // Stocke le filename de la couverture (ex: "1772987727758.jpg")

  createdAt: { type: Date, default: Date.now },

  // Options de tri
  sortOrder: { type: String, enum: ['date_desc', 'date_asc', 'manual'], default: 'date_desc' }

},

{ timestamps: true });


export default mongoose.model('Album', AlbumSchema);
