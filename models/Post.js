import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImagePath: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true }
  },
  { timestamps: true }
);

postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.model('Post', postSchema);

