import { z } from 'zod';

export const RequirementSchemaZod = z.object({
  id: z.string().describe('Unique ID like REQ-001'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().default('General'),
  mandatory: z.boolean().describe('True if this is a strict requirement, false if recommendation or optional'),
  requirementType: z.enum([
    'eligibility',
    'submission',
    'documentation',
    'project',
    'budget',
    'recommendation',
    'other'
  ]),
  sourceCitation: z.string().describe('Exact section or page number in guideline'),
  sourceText: z.string().describe('Exact or near-exact short snippet from guideline')
});

export const RequirementsExtractionResponseSchema = z.object({
  requirements: z.array(RequirementSchemaZod)
});

export const MappingItemSchemaZod = z.object({
  requirementId: z.string(),
  status: z.enum(['supported', 'weak', 'ambiguous', 'missing', 'unsupported']),
  evidence: z.string().default('No direct evidence provided'),
  evidenceCitation: z.string().default('Not found in application draft'),
  confidence: z.number().min(0).max(1).default(0.8),
  explanation: z.string(),
  clarificationQuestions: z.array(z.string()).default([]),
  supportingDocumentsNeeded: z.array(z.string()).default([])
});

export const ApplicationMappingResponseSchema = z.object({
  mappings: z.array(MappingItemSchemaZod)
});

export const UnsupportedClaimItemSchemaZod = z.object({
  id: z.string(),
  claim: z.string(),
  location: z.string(),
  reason: z.string(),
  severity: z.enum(['high', 'medium', 'low'])
});

export const UnsupportedClaimsResponseSchema = z.object({
  claims: z.array(UnsupportedClaimItemSchemaZod)
});

export const ClarificationQuestionItemSchemaZod = z.object({
  requirementId: z.string(),
  requirementTitle: z.string(),
  question: z.string()
});

export const ClarificationQuestionsResponseSchema = z.object({
  questions: z.array(ClarificationQuestionItemSchemaZod)
});

export type ExtractedRequirementsResult = z.infer<typeof RequirementsExtractionResponseSchema>;
export type ApplicationMappingsResult = z.infer<typeof ApplicationMappingResponseSchema>;
export type UnsupportedClaimsResult = z.infer<typeof UnsupportedClaimsResponseSchema>;
export type ClarificationQuestionsResult = z.infer<typeof ClarificationQuestionsResponseSchema>;
