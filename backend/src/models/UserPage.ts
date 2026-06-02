import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'gallery', 'image', 'split_text_gallery'],
    required: true
  },
  content: String,
  albumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  imageUrl: String,
  order: { type: Number, default: 0 },
  summary: { type: Boolean, default: false }
}, { _id: true });

const UserPageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  coverImage: String,
  isPublished: { type: Boolean, default: false },
  showOnBlog: { type: Boolean, default: false },
  menuGroup: {
    type: String,
    enum: ['none', 'series', 'exhibitions', 'blog', 'about'],
    default: 'none'
  },
  parentPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserPage',
    default: null
  },
  menuOrder: {
    type: Number,
    default: 0
  },
  showInMenu: {
    type: Boolean,
    default: false
  },
  sections: [SectionSchema],
  editorialSummary: String,
  seoDescription: String
}, { timestamps: true });

UserPageSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.model('UserPage', UserPageSchema);
