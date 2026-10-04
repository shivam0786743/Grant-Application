import mongoose, { Schema, Document } from 'mongoose';
import {
  IRequirement,
  IApplicationMapping,
  IUnsupportedClaim,
  IMissingDocument,
  IDeterministicSummary
} from '../types';

export interface IAssessmentDoc extends Document {
  assessmentId: string;
  title: string;
  guidelineId: string;
  guidelineVersion: number;
  guidelineFilename: string;
  guidelineContentHash: string;
  applicationId: string;
  applicationVersion: number;
  applicationFilename: string;
  applicationContentHash: string;
  requirements: IRequirement[];
  mappings: IApplicationMapping[];
  unsupportedClaims: IUnsupportedClaim[];
  missingDocuments: IMissingDocument[];
  clarificationQuestions: Array<{
    requirementId: string;
    requirementTitle: string;
    question: string;
  }>;
  deterministicSummary?: IDeterministicSummary;
  stale: boolean;
  staleReason?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  errorMessage?: string;
  supportingDocsMetadata?: Array<{
    name: string;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessmentDoc>(
  {
    assessmentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'Grant Application Assessment' },
    guidelineId: { type: String, required: true, index: true },
    guidelineVersion: { type: Number, required: true, default: 1 },
    guidelineFilename: { type: String, required: true },
    guidelineContentHash: { type: String, required: true },
    applicationId: { type: String, required: true, index: true },
    applicationVersion: { type: Number, required: true, default: 1 },
    applicationFilename: { type: String, required: true },
    applicationContentHash: { type: String, required: true },
    requirements: { type: Array, default: [] },
    mappings: { type: Array, default: [] },
    unsupportedClaims: { type: Array, default: [] },
    missingDocuments: { type: Array, default: [] },
    clarificationQuestions: { type: Array, default: [] },
    deterministicSummary: { type: Schema.Types.Mixed },
    stale: { type: Boolean, default: false, index: true },
    staleReason: { type: String },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    errorMessage: { type: String },
    supportingDocsMetadata: { type: Array, default: [] }
  } as any,
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessmentDoc>('Assessment', AssessmentSchema);
