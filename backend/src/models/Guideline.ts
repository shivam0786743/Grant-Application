import mongoose, { Schema, Document } from 'mongoose';

export interface IGuidelineDoc extends Document {
  documentId: string;
  filename: string;
  version: number;
  extractedText: string;
  contentHash: string;
  createdAt: Date;
}

const GuidelineSchema = new Schema<IGuidelineDoc>(
  {
    documentId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    extractedText: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GuidelineSchema.index({ documentId: 1, version: -1 });

export const Guideline = mongoose.model<IGuidelineDoc>('Guideline', GuidelineSchema);
