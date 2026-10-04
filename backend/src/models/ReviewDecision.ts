import mongoose, { Schema, Document } from 'mongoose';
import { ReviewAction, MappingStatus } from '../types';

export interface IReviewDecisionDoc extends Document {
  assessmentId: string;
  requirementId: string;
  action: ReviewAction;
  correctedStatus?: MappingStatus;
  reviewerNotes?: string;
  reviewedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewDecisionSchema = new Schema<IReviewDecisionDoc>(
  {
    assessmentId: { type: String, required: true, index: true },
    requirementId: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: ['confirm', 'correct', 'reject']
    },
    correctedStatus: {
      type: String,
      enum: ['supported', 'weak', 'ambiguous', 'missing', 'unsupported']
    },
    reviewerNotes: { type: String },
    reviewedBy: { type: String, default: 'Reviewer' }
  },
  { timestamps: true }
);

ReviewDecisionSchema.index({ assessmentId: 1, requirementId: 1 }, { unique: true });

export const ReviewDecision = mongoose.model<IReviewDecisionDoc>('ReviewDecision', ReviewDecisionSchema);
