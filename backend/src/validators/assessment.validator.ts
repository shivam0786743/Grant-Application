import { z } from 'zod';

export const ReviewDecisionSchema = z.object({
  action: z.enum(['confirm', 'correct', 'reject'], {
    required_error: 'Action is required and must be "confirm", "correct", or "reject"'
  }),
  correctedStatus: z
    .enum(['supported', 'weak', 'ambiguous', 'missing', 'unsupported'])
    .optional(),
  notes: z.string().max(2000).optional(),
  reviewedBy: z.string().max(100).optional()
}).refine(
  (data) => {
    if (data.action === 'correct' && !data.correctedStatus) {
      return false;
    }
    return true;
  },
  {
    message: 'When action is "correct", a valid correctedStatus must be specified.',
    path: ['correctedStatus']
  }
);

export const UpdateDocumentStatusSchema = z.object({
  status: z.enum(['missing', 'provided', 'not_applicable'], {
    required_error: 'Status is required and must be "missing", "provided", or "not_applicable"'
  })
});
