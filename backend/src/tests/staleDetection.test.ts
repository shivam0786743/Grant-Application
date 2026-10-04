import { Guideline } from '../models/Guideline';
import { Application } from '../models/Application';
import { Assessment } from '../models/Assessment';
import { AssessmentService } from '../services/assessment/assessment.service';
import { computeContentHash } from '../utils/hash';

describe('Assessment Versioning & Stale Detection', () => {
  let assessmentService: AssessmentService;

  beforeEach(() => {
    assessmentService = new AssessmentService();
    jest.clearAllMocks();
  });

  it('marks assessment as NOT stale when document hashes match latest versions', async () => {
    const guidelineFilename = 'Guidelines_2024.txt';
    const appFilename = 'Draft_Proposal.txt';

    const textG1 = 'Guideline Version 1 text content';
    const hashG1 = computeContentHash(textG1);

    const textA1 = 'Proposal Version 1 text content';
    const hashA1 = computeContentHash(textA1);

    const mockAssessment: any = {
      assessmentId: 'ASM-1',
      guidelineFilename,
      guidelineVersion: 1,
      guidelineContentHash: hashG1,
      applicationFilename: appFilename,
      applicationVersion: 1,
      applicationContentHash: hashA1,
      stale: false,
      staleReason: undefined,
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock Guideline.findOne and Application.findOne returning matching hashes
    jest.spyOn(Guideline, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 1,
        contentHash: hashG1
      })
    } as any);

    jest.spyOn(Application, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 1,
        contentHash: hashA1
      })
    } as any);

    const isStale = await assessmentService.checkAndUpdateStaleness(mockAssessment);

    expect(isStale).toBe(false);
    expect(mockAssessment.stale).toBe(false);
  });

  it('marks assessment as STALE when newer guideline document version has different content hash', async () => {
    const guidelineFilename = 'NSF_Guidelines_2024.txt';
    const appFilename = 'My_Draft_Proposal.txt';

    const hashV1 = computeContentHash('Guideline Version 1 text');
    const hashV2 = computeContentHash('Guideline Version 2 with new mandatory rules');
    const appHash = computeContentHash('Application Draft text');

    const mockAssessment: any = {
      assessmentId: 'ASM-TEST-1',
      guidelineFilename,
      guidelineVersion: 1,
      guidelineContentHash: hashV1,
      applicationFilename: appFilename,
      applicationVersion: 1,
      applicationContentHash: appHash,
      stale: false,
      staleReason: undefined,
      save: jest.fn().mockResolvedValue(true)
    };

    // Simulate Guideline having a newer version in the database
    jest.spyOn(Guideline, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 2,
        contentHash: hashV2
      })
    } as any);

    jest.spyOn(Application, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 1,
        contentHash: appHash
      })
    } as any);

    const isStale = await assessmentService.checkAndUpdateStaleness(mockAssessment);

    expect(isStale).toBe(true);
    expect(mockAssessment.stale).toBe(true);
    expect(mockAssessment.staleReason).toContain('guideline document');
    expect(mockAssessment.staleReason).toContain('Version 2');
    expect(mockAssessment.save).toHaveBeenCalled();
  });

  it('marks assessment as STALE when draft application has been modified', async () => {
    const guidelineFilename = 'Guidelines.txt';
    const appFilename = 'Proposal.txt';

    const gHash = computeContentHash('Guideline text');
    const appHashV1 = computeContentHash('Original draft proposal');
    const appHashV2 = computeContentHash('Modified draft proposal with updated budget');

    const mockAssessment: any = {
      assessmentId: 'ASM-TEST-2',
      guidelineFilename,
      guidelineVersion: 1,
      guidelineContentHash: gHash,
      applicationFilename: appFilename,
      applicationVersion: 1,
      applicationContentHash: appHashV1,
      stale: false,
      staleReason: undefined,
      save: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(Guideline, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 1,
        contentHash: gHash
      })
    } as any);

    jest.spyOn(Application, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        version: 2,
        contentHash: appHashV2
      })
    } as any);

    const isStale = await assessmentService.checkAndUpdateStaleness(mockAssessment);

    expect(isStale).toBe(true);
    expect(mockAssessment.stale).toBe(true);
    expect(mockAssessment.staleReason).toContain('draft application');
    expect(mockAssessment.save).toHaveBeenCalled();
  });
});
