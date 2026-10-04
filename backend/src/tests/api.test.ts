import request from 'supertest';
import app from '../app';
import { assessmentService } from '../services/assessment/assessment.service';
import { Assessment } from '../models/Assessment';

describe('Assessment REST API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/health returns 200 OK with health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('Grant Application Completeness Assistant');
  });

  it('POST /api/assessments validates missing guideline/application inputs', async () => {
    const res = await request(app)
      .post('/api/assessments')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_GUIDELINE');
  });

  it('POST /api/assessments creates and analyzes assessment successfully', async () => {
    const mockAssessment: any = {
      assessmentId: 'ASM-123',
      title: 'API Integration Test Assessment',
      guidelineFilename: 'guidelines.txt',
      applicationFilename: 'application.txt',
      requirements: [
        { id: 'REQ-1', title: '501(c)(3) Status', mandatory: true }
      ],
      mappings: [
        { requirementId: 'REQ-1', status: 'supported' }
      ],
      deterministicSummary: {
        completenessScore: 100,
        totalMandatory: 1,
        supported: 1
      }
    };

    jest.spyOn(assessmentService, 'createAssessment').mockResolvedValue(mockAssessment);

    const res = await request(app)
      .post('/api/assessments')
      .send({
        guidelineFilename: 'guidelines.txt',
        guidelineText: 'Section 1: Applicant must be a 501(c)(3) organization.',
        applicationFilename: 'application.txt',
        applicationText: 'Our organization is a registered 501(c)(3) nonprofit.',
        title: 'API Integration Test Assessment'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessmentId).toBe('ASM-123');
    expect(res.body.data.deterministicSummary.completenessScore).toBe(100);
  });

  it('PATCH /api/assessments/:id/mappings/:requirementId handles review decisions and recalculates score', async () => {
    const mockUpdatedAssessment: any = {
      assessmentId: 'ASM-123',
      mappings: [
        {
          requirementId: 'REQ-1',
          status: 'weak',
          userDecision: {
            action: 'correct',
            correctedStatus: 'supported',
            notes: 'Verified proof',
            reviewedBy: 'Senior Assessor'
          }
        }
      ],
      deterministicSummary: {
        completenessScore: 100
      }
    };

    jest.spyOn(assessmentService, 'updateMappingDecision').mockResolvedValue(mockUpdatedAssessment);

    const res = await request(app)
      .patch('/api/assessments/ASM-123/mappings/REQ-1')
      .send({
        action: 'correct',
        correctedStatus: 'supported',
        notes: 'Verified proof',
        reviewedBy: 'Senior Assessor'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mappings[0].userDecision.action).toBe('correct');
    expect(res.body.data.mappings[0].userDecision.correctedStatus).toBe('supported');
  });

  it('PATCH /api/assessments/:id/documents/:documentId/status updates document status', async () => {
    const mockUpdatedAssessment: any = {
      assessmentId: 'ASM-123',
      missingDocuments: [
        {
          id: 'DOC-1',
          documentName: 'Tax Letter',
          status: 'provided'
        }
      ]
    };

    jest.spyOn(assessmentService, 'updateDocumentStatus').mockResolvedValue(mockUpdatedAssessment);

    const res = await request(app)
      .patch('/api/assessments/ASM-123/documents/DOC-1/status')
      .send({
        status: 'provided'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.missingDocuments[0].status).toBe('provided');
  });

  it('GET /api/assessments/:id/summary returns comprehensive summary with non-legal disclaimer', async () => {
    const mockSummary: any = {
      assessmentId: 'ASM-123',
      completenessScore: 85,
      mandatoryRequirementStats: {
        total: 5,
        supported: 4,
        weak: 1,
        ambiguous: 0,
        missing: 0,
        unsupported: 0
      },
      disclaimer: 'DISCLAIMER: This report is an automated completeness assessment tool for preliminary draft review against provided guidelines. It does NOT constitute a legal, formal, or authoritative funding-eligibility decision.'
    };

    jest.spyOn(assessmentService, 'getSummary').mockResolvedValue(mockSummary);

    const res = await request(app).get('/api/assessments/ASM-123/summary');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessmentId).toBe('ASM-123');
    expect(res.body.data.completenessScore).toBe(85);
    expect(res.body.data.disclaimer).toContain('does NOT constitute a legal, formal, or authoritative funding-eligibility decision');
  });

  it('GET /api/assessments/:id returns 404 when assessment does not exist', async () => {
    jest.spyOn(assessmentService, 'getAssessment').mockResolvedValue(null);

    const res = await request(app).get('/api/assessments/NONEXISTENT-ID');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
