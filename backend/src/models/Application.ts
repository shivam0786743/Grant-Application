import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationDoc extends Document {
  documentId: string;
  filename: string;
  version: number;
  extractedText: string;
  contentHash: string;
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplicationDoc>(
  {
    documentId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    extractedText: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ApplicationSchema.index({ documentId: 1, version: -1 });

export const Application = mongoose.model<IApplicationDoc>('Application', ApplicationSchema);
