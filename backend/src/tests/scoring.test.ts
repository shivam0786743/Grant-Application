import { ScoringService } from '../services/assessment/scoring.service';
import { IRequirement, IApplicationMapping } from '../types';

describe('Deterministic Scoring Engine', () => {
  const scoringService = new ScoringService();

  const mockRequirements: IRequirement[] = [
    {
      id: 'REQ-1',
      title: '501(c)(3) Status',
      description: 'Proof of non-profit',
      category: 'Eligibility',
      mandatory: true,
      requirementType: 'eligibility',
      sourceCitation: 'Sec 1',
      sourceText: 'Must be 501(c)(3)'
    },
    {
      id: 'REQ-2',
      title: 'Detailed Budget',
      description: 'Itemized 12-month budget',
      category: 'Budget',
      mandatory: true,
      requirementType: 'budget',
      sourceCitation: 'Sec 2',
      sourceText: 'Line item budget required'
    },
    {
      id: 'REQ-3',
      title: 'Project Timeline',
      description: 'Quarterly milestones',
      category: 'Project',
      mandatory: true,
      requirementType: 'project',
      sourceCitation: 'Sec 3',
      sourceText: 'Quarterly milestones required'
    },
    {
      id: 'REQ-4',
      title: 'Community Letters',
      description: 'Support letters',
      category: 'Partnerships',
      mandatory: false, // Recommendation!
      requirementType: 'recommendation',
      sourceCitation: 'Sec 4',
      sourceText: 'Letters are encouraged'
    }
  ];

  it('calculates 100% when all mandatory requirements are supported', () => {
    const mappings: IApplicationMapping[] = [
      {
        requirementId: 'REQ-1',
        status: 'supported',
        evidence: 'Proof provided',
        evidenceCitation: 'p. 1',
        confidence: 0.95,
        explanation: 'Complete',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-2',
        status: 'supported',
        evidence: 'Budget included',
        evidenceCitation: 'p. 3',
        confidence: 0.9,
        explanation: 'Complete',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-3',
        status: 'supported',
        evidence: 'Milestones listed',
        evidenceCitation: 'p. 5',
        confidence: 0.9,
        explanation: 'Complete',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      }
    ];

    const result = scoringService.calculateCompleteness(mockRequirements, mappings);

    expect(result.totalMandatory).toBe(3);
    expect(result.supported).toBe(3);
    expect(result.missing).toBe(0);
    expect(result.completenessScore).toBe(100);
  });

  it('correctly weighs weak (0.4) and ambiguous (0.2) mandatory requirements', () => {
    // 3 mandatory reqs:
    // REQ-1: supported (1.0 pt)
    // REQ-2: weak (0.4 pt)
    // REQ-3: missing (0.0 pt)
    // Total pts = 1.4 / 3 = 46.7%
    const mappings: IApplicationMapping[] = [
      {
        requirementId: 'REQ-1',
        status: 'supported',
        evidence: 'Valid',
        evidenceCitation: 'p. 1',
        confidence: 0.9,
        explanation: 'Good',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-2',
        status: 'weak',
        evidence: 'High-level only',
        evidenceCitation: 'p. 2',
        confidence: 0.7,
        explanation: 'Needs more detail',
        clarificationQuestions: ['Breakdown?'],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-3',
        status: 'missing',
        evidence: 'None',
        evidenceCitation: 'None',
        confidence: 0.9,
        explanation: 'Not addressed',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      }
    ];

    const result = scoringService.calculateCompleteness(mockRequirements, mappings);

    expect(result.totalMandatory).toBe(3);
    expect(result.supported).toBe(1);
    expect(result.weak).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.completenessScore).toBe(46.7);
  });

  it('excludes recommendations from mandatory score and tracks them separately', () => {
    // REQ-4 is recommendation.
    // If mandatory reqs are missing, score is 0% even if recommendation is supported.
    const mappings: IApplicationMapping[] = [
      {
        requirementId: 'REQ-1',
        status: 'missing',
        evidence: 'None',
        evidenceCitation: 'None',
        confidence: 1,
        explanation: '',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-2',
        status: 'missing',
        evidence: 'None',
        evidenceCitation: 'None',
        confidence: 1,
        explanation: '',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-3',
        status: 'missing',
        evidence: 'None',
        evidenceCitation: 'None',
        confidence: 1,
        explanation: '',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      },
      {
        requirementId: 'REQ-4', // recommendation
        status: 'supported',
        evidence: 'Partner letters attached',
        evidenceCitation: 'Appendix B',
        confidence: 0.95,
        explanation: 'Letters provided',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      }
    ];

    const result = scoringService.calculateCompleteness(mockRequirements, mappings);

    expect(result.totalMandatory).toBe(3);
    expect(result.completenessScore).toBe(0);
    expect(result.totalRecommendations).toBe(1);
    expect(result.recommendationsSupported).toBe(1);
    expect(result.recommendationScore).toBe(100);
  });

  it('applies user review decisions (Confirm / Correct / Reject) dynamically', () => {
    const mappings: IApplicationMapping[] = [
      {
        requirementId: 'REQ-1',
        status: 'weak',
        evidence: 'Initial weak evidence',
        evidenceCitation: 'p. 1',
        confidence: 0.5,
        explanation: 'AI thought weak',
        clarificationQuestions: [],
        supportingDocumentsNeeded: [],
        // User corrected it to supported!
        userDecision: {
          action: 'correct',
          correctedStatus: 'supported',
          notes: 'Reviewer found proof in Appendix A',
          reviewedAt: new Date()
        }
      },
      {
        requirementId: 'REQ-2',
        status: 'supported',
        evidence: 'AI thought supported',
        evidenceCitation: 'p. 2',
        confidence: 0.8,
        explanation: '',
        clarificationQuestions: [],
        supportingDocumentsNeeded: [],
        // User rejected it!
        userDecision: {
          action: 'reject',
          notes: 'Attachment is empty',
          reviewedAt: new Date()
        }
      },
      {
        requirementId: 'REQ-3',
        status: 'supported',
        evidence: 'AI confirmed',
        evidenceCitation: 'p. 3',
        confidence: 0.9,
        explanation: '',
        clarificationQuestions: [],
        supportingDocumentsNeeded: [],
        // User confirmed
        userDecision: {
          action: 'confirm',
          reviewedAt: new Date()
        }
      }
    ];

    const result = scoringService.calculateCompleteness(mockRequirements, mappings);

    // REQ-1: corrected to supported -> 1.0 pt
    // REQ-2: rejected -> treated as missing -> 0.0 pt
    // REQ-3: confirmed supported -> 1.0 pt
    // Total pts = 2.0 / 3 = 66.7%
    expect(result.supported).toBe(2);
    expect(result.missing).toBe(1);
    expect(result.completenessScore).toBe(66.7);
  });
});
