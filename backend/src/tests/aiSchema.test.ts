import {
  RequirementsExtractionResponseSchema,
  ApplicationMappingResponseSchema,
  UnsupportedClaimsResponseSchema,
  ClarificationQuestionsResponseSchema
} from '../services/ai/schemas';

describe('AI Structured Output Schemas & Validation', () => {
  it('validates a compliant requirement extraction JSON object', () => {
    const validJson = {
      requirements: [
        {
          id: 'REQ-001',
          title: 'Tax Status',
          description: 'Must have 501c3',
          category: 'Eligibility',
          mandatory: true,
          requirementType: 'eligibility',
          sourceCitation: 'Sec 1.2',
          sourceText: 'Tax-exempt status required'
        }
      ]
    };

    const parsed = RequirementsExtractionResponseSchema.parse(validJson);
    expect(parsed.requirements.length).toBe(1);
    expect(parsed.requirements[0].id).toBe('REQ-001');
  });

  it('rejects requirement extraction when missing required fields', () => {
    const invalidJson = {
      requirements: [
        {
          id: 'REQ-001',
          // title is missing
          description: 'No title given',
          mandatory: true
        }
      ]
    };

    expect(() => RequirementsExtractionResponseSchema.parse(invalidJson)).toThrow();
  });

  it('rejects application mapping with invalid status', () => {
    const invalidMapping = {
      mappings: [
        {
          requirementId: 'REQ-001',
          status: 'partially-done', // Invalid enum! Must be supported, weak, ambiguous, missing, unsupported
          evidence: 'Some text',
          evidenceCitation: 'p. 1',
          confidence: 0.8,
          explanation: 'Testing invalid status'
        }
      ]
    };

    expect(() => ApplicationMappingResponseSchema.parse(invalidMapping)).toThrow();
  });

  it('correctly parses unsupported claims and severity', () => {
    const claimsJson = {
      claims: [
        {
          id: 'CLAIM-1',
          claim: 'We have 1,000,000 active students in 40 countries',
          location: 'Section 1.1',
          reason: 'No third-party data or citations attached',
          severity: 'high'
        }
      ]
    };

    const parsed = UnsupportedClaimsResponseSchema.parse(claimsJson);
    expect(parsed.claims[0].severity).toBe('high');
    expect(parsed.claims[0].id).toBe('CLAIM-1');
  });

  it('correctly parses clarification questions', () => {
    const questionsJson = {
      questions: [
        {
          requirementId: 'REQ-002',
          requirementTitle: 'Budget Line Items',
          question: 'Can you provide the itemized personnel breakdown?'
        }
      ]
    };

    const parsed = ClarificationQuestionsResponseSchema.parse(questionsJson);
    expect(parsed.questions.length).toBe(1);
    expect(parsed.questions[0].requirementId).toBe('REQ-002');
  });
});
