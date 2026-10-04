import { Router } from 'express';
import { assessmentController } from '../controllers/assessment.controller';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// Upload documents and run completeness analysis
router.post(
  '/',
  uploadMiddleware.fields([
    { name: 'guidelineFile', maxCount: 1 },
    { name: 'applicationFile', maxCount: 1 }
  ]),
  assessmentController.createAssessment.bind(assessmentController)
);

// List past assessments
router.get('/', assessmentController.listAssessments.bind(assessmentController));

// Get full assessment
router.get('/:id', assessmentController.getAssessment.bind(assessmentController));

// Get extracted requirements
router.get('/:id/requirements', assessmentController.getRequirements.bind(assessmentController));

// Get mappings
router.get('/:id/mappings', assessmentController.getMappings.bind(assessmentController));

// Review a mapping (Confirm / Correct / Reject)
router.patch(
  '/:id/mappings/:requirementId',
  assessmentController.updateMappingDecision.bind(assessmentController)
);

// Recalculate deterministic score
router.post(
  '/:id/recalculate',
  assessmentController.recalculate.bind(assessmentController)
);

// Final reviewed completeness summary
router.get('/:id/summary', assessmentController.getSummary.bind(assessmentController));

// Update supporting document status (missing / provided / not_applicable)
router.patch(
  '/:id/documents/:documentId/status',
  assessmentController.updateDocumentStatus.bind(assessmentController)
);

export const assessmentRoutes = router;
