import mongoose, { Schema, Document } from 'mongoose';
import { IRequirement, RequirementType } from '../types';

export interface IRequirementDoc extends Document {
  assessmentId: string;
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  requirementType: RequirementType;
  sourceCitation: string;
  sourceText: string;
}

const RequirementSchema = new Schema<IRequirementDoc>(
  {
    assessmentId: { type: String, required: true, index: true },
    id: { type: String, required: true }, // e.g. REQ-001
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    mandatory: { type: Boolean, required: true, default: true },
    requirementType: {
      type: String,
      required: true,
      enum: ['eligibility', 'submission', 'documentation', 'project', 'budget', 'recommendation', 'other']
    },
    sourceCitation: { type: String, required: true },
    sourceText: { type: String, required: true }
  },
  { timestamps: true }
);

RequirementSchema.index({ assessmentId: 1, id: 1 }, { unique: true });

export const Requirement = mongoose.model<IRequirementDoc>('Requirement', RequirementSchema);
