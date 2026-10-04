export type RequirementType =
  | 'eligibility'
  | 'submission'
  | 'documentation'
  | 'project'
  | 'budget'
  | 'recommendation'
  | 'other';

export type MappingStatus =
  | 'supported'
  | 'weak'
  | 'ambiguous'
  | 'missing'
  | 'unsupported';

export type ClaimSeverity = 'high' | 'medium' | 'low';

export type DocumentReviewStatus = 'missing' | 'provided' | 'not_applicable';

export type ReviewAction = 'confirm' | 'correct' | 'reject';

export interface IRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  requirementType: RequirementType;
  sourceCitation: string;
  sourceText: string;
}

export interface IUserDecision {
  action: ReviewAction;
  correctedStatus?: MappingStatus;
  notes?: string;
  reviewedAt: string;
  reviewedBy?: string;
}

export interface IApplicationMapping {
  requirementId: string;
  status: MappingStatus;
  evidence: string;
  evidenceCitation: string;
  confidence: number;
  explanation: string;
  clarificationQuestions: string[];
  supportingDocumentsNeeded: string[];
  userDecision?: IUserDecision;
}

export interface IUnsupportedClaim {
  id: string;
  claim: string;
  location: string;
  reason: string;
  severity: ClaimSeverity;
}

export interface IMissingDocument {
  id: string;
  documentName: string;
  reason: string;
  status: DocumentReviewStatus;
  requirementId?: string;
}

export interface IDeterministicSummary {
  totalMandatory: number;
  supported: number;
  weak: number;
  ambiguous: number;
  missing: number;
  unsupported: number;
  completenessScore: number;
  totalRecommendations: number;
  recommendationsSupported: number;
  recommendationScore: number;
  formulaExplanation: string;
  effectiveStatuses: Record<string, MappingStatus>;
}

export interface IAssessment {
  _id?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IAssessmentSummary {
  assessmentId: string;
  title?: string;
  completenessScore: number;
  deterministicSummary: IDeterministicSummary;
  mandatoryRequirementStats: {
    total: number;
    supported: number;
    weak: number;
    ambiguous: number;
    missing: number;
    unsupported: number;
  };
  supportedRequirements: Array<{
    requirement: IRequirement;
    mapping: IApplicationMapping;
  }>;
  weakAmbiguousRequirements: Array<{
    requirement: IRequirement;
    mapping: IApplicationMapping;
  }>;
  missingRequirements: Array<{
    requirement: IRequirement;
    mapping: IApplicationMapping;
  }>;
  unsupportedClaims: IUnsupportedClaim[];
  missingSupportingDocuments: IMissingDocument[];
  allClarificationQuestions: Array<{
    requirementId: string;
    requirementTitle: string;
    question: string;
  }>;
  userReviewDecisionsCount: {
    confirmed: number;
    corrected: number;
    rejected: number;
    pending: number;
  };
  guidelineVersion: number;
  applicationVersion: number;
  guidelineFilename: string;
  applicationFilename: string;
  stale: boolean;
  staleReason?: string;
  timestamp: string;
  disclaimer: string;
}
