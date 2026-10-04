import { Request, Response, NextFunction } from 'express';
import { assessmentService } from '../services/assessment/assessment.service';
import { documentExtractorService } from '../services/document/extractor.service';
import { Assessment } from '../models/Assessment';
import { sendSuccess, sendError } from '../utils/response';
import { ReviewDecisionSchema, UpdateDocumentStatusSchema } from '../validators/assessment.validator';
import { logger } from '../utils/logger';

export class AssessmentController {
  /**
   * POST /api/assessments
   * Uploads guideline & application files and initiates completeness assessment.
   */
  public async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const guidelineFile = files?.['guidelineFile']?.[0];
      const applicationFile = files?.['applicationFile']?.[0];

      // Support direct text submission or uploaded files
      let guidelineText = req.body.guidelineText;
      let guidelineFilename = req.body.guidelineFilename || 'guideline.txt';

      let applicationText = req.body.applicationText;
      let applicationFilename = req.body.applicationFilename || 'application.txt';

      if (guidelineFile) {
        guidelineFilename = guidelineFile.originalname;
        const extracted = await documentExtractorService.extractText(
          guidelineFile.buffer,
          guidelineFile.originalname,
          guidelineFile.mimetype
        );
        guidelineText = extracted.text;
      }

      if (applicationFile) {
        applicationFilename = applicationFile.originalname;
        const extracted = await documentExtractorService.extractText(
          applicationFile.buffer,
          applicationFile.originalname,
          applicationFile.mimetype
        );
        applicationText = extracted.text;
      }

      if (!guidelineText || guidelineText.trim().length === 0) {
        return sendError(
          res,
          400,
          'MISSING_GUIDELINE',
          'A grant guideline document (PDF, DOCX, or TXT) or raw text must be provided.'
        );
      }

      if (!applicationText || applicationText.trim().length === 0) {
        return sendError(
          res,
          400,
          'MISSING_APPLICATION',
          'A draft application document (PDF, DOCX, or TXT) or raw text must be provided.'
        );
      }

      // Parse supportingDocsMetadata if provided
      let supportingDocsMetadata: Array<{ name: string; notes?: string }> = [];
      if (req.body.supportingDocsMetadata) {
        try {
          supportingDocsMetadata = typeof req.body.supportingDocsMetadata === 'string'
            ? JSON.parse(req.body.supportingDocsMetadata)
            : req.body.supportingDocsMetadata;
        } catch {
          logger.warn('Failed to parse supportingDocsMetadata JSON, ignoring.');
        }
      }

      const assessment = await assessmentService.createAssessment({
        guidelineFilename,
        guidelineText,
        applicationFilename,
        applicationText,
        supportingDocsMetadata,
        title: req.body.title
      });

      return sendSuccess(res, assessment, 201, 'Assessment created and analyzed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments
   * Lists past assessments.
   */
  public async listAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await Assessment.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('assessmentId title guidelineFilename applicationFilename status stale createdAt updatedAt deterministicSummary.completenessScore');
      return sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id
   */
  public async getAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentService.getAssessment(req.params.id);
      if (!assessment) {
        return sendError(res, 404, 'NOT_FOUND', `Assessment "${req.params.id}" not found.`);
      }
      return sendSuccess(res, assessment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id/requirements
   */
  public async getRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentService.getAssessment(req.params.id);
      if (!assessment) {
        return sendError(res, 404, 'NOT_FOUND', `Assessment "${req.params.id}" not found.`);
      }
      return sendSuccess(res, assessment.requirements);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id/mappings
   */
  public async getMappings(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentService.getAssessment(req.params.id);
      if (!assessment) {
        return sendError(res, 404, 'NOT_FOUND', `Assessment "${req.params.id}" not found.`);
      }
      return sendSuccess(res, assessment.mappings);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/assessments/:id/mappings/:requirementId
   * User reviews an AI mapping: confirm, correct, or reject.
   */
  public async updateMappingDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: assessmentId, requirementId } = req.params;
      const validated = ReviewDecisionSchema.parse(req.body);

      const updated = await assessmentService.updateMappingDecision({
        assessmentId,
        requirementId,
        action: validated.action,
        correctedStatus: validated.correctedStatus,
        notes: validated.notes,
        reviewedBy: validated.reviewedBy
      });

      return sendSuccess(res, updated, 200, 'Review decision saved and score recalculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/assessments/:id/recalculate
   * Deterministically recalculates score using latest review decisions.
   */
  public async recalculate(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentService.getAssessment(req.params.id);
      if (!assessment) {
        return sendError(res, 404, 'NOT_FOUND', `Assessment "${req.params.id}" not found.`);
      }
      return sendSuccess(res, assessment.deterministicSummary, 200, 'Assessment score recalculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id/summary
   * Compiles and returns final reviewed completeness summary with statistics.
   */
  public async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await assessmentService.getSummary(req.params.id);
      return sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/assessments/:id/documents/:documentId/status
   * Updates status of a supporting document (missing / provided / not_applicable).
   */
  public async updateDocumentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: assessmentId, documentId } = req.params;
      const validated = UpdateDocumentStatusSchema.parse(req.body);

      const updated = await assessmentService.updateDocumentStatus({
        assessmentId,
        documentId,
        status: validated.status
      });

      return sendSuccess(res, updated, 200, 'Document status updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const assessmentController = new AssessmentController();
