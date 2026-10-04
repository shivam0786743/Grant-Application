import crypto from 'crypto';
import { Guideline } from '../../models/Guideline';
import { Application } from '../../models/Application';
import { Requirement } from '../../models/Requirement';
import { Assessment, IAssessmentDoc } from '../../models/Assessment';
import { ReviewDecision } from '../../models/ReviewDecision';
import { geminiService } from '../ai/gemini.service';
import { scoringService } from './scoring.service';
import { computeContentHash } from '../../utils/hash';
import { logger } from '../../utils/logger';
import {
  IRequirement,
  IApplicationMapping,
  IUnsupportedClaim,
  IMissingDocument,
  ReviewAction,
  MappingStatus,
  DocumentReviewStatus,
  IAssessmentSummary
} from '../../types';

export class AssessmentService {
  /**
   * Creates and runs a complete assessment for uploaded guideline and application documents.
   */
  public async createAssessment(params: {
    guidelineFilename: string;
    guidelineText: string;
    applicationFilename: string;
    applicationText: string;
    supportingDocsMetadata?: Array<{ name: string; notes?: string }>;
    title?: string;
  }): Promise<IAssessmentDoc> {
    const {
      guidelineFilename,
      guidelineText,
      applicationFilename,
      applicationText,
      supportingDocsMetadata,
      title
    } = params;

    const guidelineContentHash = computeContentHash(guidelineText);
    const applicationContentHash = computeContentHash(applicationText);

    const assessmentId = `ASM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const guidelineDocId = `GDL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const applicationDocId = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Determine versioning: check if previous documents exist with this filename
    const prevGuideline = await Guideline.findOne({ filename: guidelineFilename }).sort({ version: -1 });
    const guidelineVersion = prevGuideline ? prevGuideline.version + 1 : 1;

    const prevApp = await Application.findOne({ filename: applicationFilename }).sort({ version: -1 });
    const applicationVersion = prevApp ? prevApp.version + 1 : 1;

    // Persist Guideline and Application records
    await Guideline.create({
      documentId: guidelineDocId,
      filename: guidelineFilename,
      version: guidelineVersion,
      extractedText: guidelineText,
      contentHash: guidelineContentHash
    });

    await Application.create({
      documentId: applicationDocId,
      filename: applicationFilename,
      version: applicationVersion,
      extractedText: applicationText,
      contentHash: applicationContentHash
    });

    // Create Initial Assessment Record
    const assessment = new Assessment({
      assessmentId,
      title: title || `Assessment: ${applicationFilename} vs ${guidelineFilename}`,
      guidelineId: guidelineDocId,
      guidelineVersion,
      guidelineFilename,
      guidelineContentHash,
      applicationId: applicationDocId,
      applicationVersion,
      applicationFilename,
      applicationContentHash,
      status: 'analyzing',
      stale: false,
      supportingDocsMetadata: supportingDocsMetadata || []
    });

    await assessment.save();

    try {
      logger.info(`Starting AI analysis pipeline for assessment ${assessmentId}...`);

      // Step 1: AI extracts structured requirements from guideline
      const requirements: IRequirement[] = await geminiService.extractRequirements(guidelineText);
      logger.info(`Extracted ${requirements.length} requirements for assessment ${assessmentId}`);

      // Persist individual requirements in DB
      for (const req of requirements) {
        await Requirement.create({
          assessmentId,
          id: req.id,
          title: req.title,
          description: req.description,
          category: req.category,
          mandatory: req.mandatory,
          requirementType: req.requirementType,
          sourceCitation: req.sourceCitation,
          sourceText: req.sourceText
        });
      }

      // Step 2: AI maps draft application to requirements
      const mappings: IApplicationMapping[] = await geminiService.mapApplicationToRequirements(
        requirements,
        applicationText
      );
      logger.info(`Generated ${mappings.length} mappings for assessment ${assessmentId}`);

      // Step 3: AI detects unsupported claims
      const unsupportedClaims: IUnsupportedClaim[] = await geminiService.detectUnsupportedClaims(
        applicationText
      );
      logger.info(`Detected ${unsupportedClaims.length} unsupported claims`);

      // Step 4: Aggregate missing documents from mappings and requirements
      const missingDocuments: IMissingDocument[] = [];
      const docNameSet = new Set<string>();

      for (const m of mappings) {
        for (const doc of m.supportingDocumentsNeeded || []) {
          const trimmed = doc.trim();
          if (trimmed && !docNameSet.has(trimmed.toLowerCase())) {
            docNameSet.add(trimmed.toLowerCase());
            missingDocuments.push({
              id: `DOC-${missingDocuments.length + 1}`,
              documentName: trimmed,
              reason: `Required to substantiate requirement ${m.requirementId} (${m.status})`,
              status: 'missing',
              requirementId: m.requirementId
            });
          }
        }
      }

      // Step 5: Generate clarification questions for weak/ambiguous/missing items
      const weakOrMissing = mappings
        .filter((m) => m.status === 'weak' || m.status === 'ambiguous' || m.status === 'missing' || m.status === 'unsupported')
        .map((m) => {
          const req = requirements.find((r) => r.id === m.requirementId);
          return {
            requirementId: m.requirementId,
            requirementTitle: req?.title || m.requirementId,
            status: m.status,
            explanation: m.explanation
          };
        });

      const clarificationQuestions = await geminiService.generateClarificationQuestions(weakOrMissing);

      // Step 6: Deterministic Scoring (in TypeScript code, NOT in LLM)
      const deterministicSummary = scoringService.calculateCompleteness(requirements, mappings);

      // Update assessment record with results
      assessment.requirements = requirements;
      assessment.mappings = mappings;
      assessment.unsupportedClaims = unsupportedClaims;
      assessment.missingDocuments = missingDocuments;
      assessment.clarificationQuestions = clarificationQuestions;
      assessment.deterministicSummary = deterministicSummary;
      assessment.status = 'completed';

      await assessment.save();
      logger.info(`Assessment ${assessmentId} successfully completed with score: ${deterministicSummary.completenessScore}%`);

      return assessment;
    } catch (err: any) {
      logger.error(`Assessment analysis failed for ${assessmentId}: ${err.message}`);
      assessment.status = 'failed';
      assessment.errorMessage = err.message;
      await assessment.save();
      throw err;
    }
  }

  /**
   * Retrieves assessment by ID, overlays latest review decisions,
   * checks for staleness, and recalculates deterministic score.
   */
  public async getAssessment(assessmentId: string): Promise<IAssessmentDoc | null> {
    const assessment = await Assessment.findOne({ assessmentId });
    if (!assessment) return null;

    // Check staleness against latest guideline & application hashes
    await this.checkAndUpdateStaleness(assessment);

    // Overlay user review decisions from ReviewDecision collection
    const decisions = await ReviewDecision.find({ assessmentId });
    const decisionMap = new Map<string, any>();
    for (const d of decisions) {
      decisionMap.set(d.requirementId, d);
    }

    let modified = false;
    const updatedMappings = assessment.mappings.map((m) => {
      const decision = decisionMap.get(m.requirementId);
      if (decision) {
        return {
          ...m,
          userDecision: {
            action: decision.action,
            correctedStatus: decision.correctedStatus,
            notes: decision.reviewerNotes,
            reviewedAt: decision.updatedAt || decision.createdAt,
            reviewedBy: decision.reviewedBy
          }
        };
      }
      return m;
    });

    assessment.mappings = updatedMappings;

    // Recalculate deterministic summary based on effective mappings
    if (assessment.requirements && assessment.requirements.length > 0) {
      assessment.deterministicSummary = scoringService.calculateCompleteness(
        assessment.requirements,
        assessment.mappings
      );
      modified = true;
    }

    if (modified) {
      await assessment.save();
    }

    return assessment;
  }

  /**
   * Stale detection:
   * Compares the assessment's original guideline & application hashes
   * against the newest versions in the database.
   */
  public async checkAndUpdateStaleness(assessment: IAssessmentDoc): Promise<boolean> {
    let isStale = false;
    let staleReason = '';

    const latestGuideline = await Guideline.findOne({ filename: assessment.guidelineFilename }).sort({ version: -1 });
    if (latestGuideline && latestGuideline.contentHash !== assessment.guidelineContentHash) {
      isStale = true;
      staleReason = `The guideline document "${assessment.guidelineFilename}" has been updated (Version ${latestGuideline.version} vs assessed Version ${assessment.guidelineVersion}).`;
    }

    const latestApp = await Application.findOne({ filename: assessment.applicationFilename }).sort({ version: -1 });
    if (latestApp && latestApp.contentHash !== assessment.applicationContentHash) {
      isStale = true;
      staleReason = staleReason
        ? `${staleReason} Additionally, draft application "${assessment.applicationFilename}" has been modified (Version ${latestApp.version} vs assessed Version ${assessment.applicationVersion}).`
        : `The draft application document "${assessment.applicationFilename}" has been updated (Version ${latestApp.version} vs assessed Version ${assessment.applicationVersion}).`;
    }

    if (assessment.stale !== isStale || assessment.staleReason !== staleReason) {
      assessment.stale = isStale;
      assessment.staleReason = staleReason;
      await assessment.save();
    }

    return isStale;
  }

  /**
   * Records or updates a user's review decision (Confirm / Correct / Reject)
   * for a specific requirement mapping.
   */
  public async updateMappingDecision(params: {
    assessmentId: string;
    requirementId: string;
    action: ReviewAction;
    correctedStatus?: MappingStatus;
    notes?: string;
    reviewedBy?: string;
  }): Promise<IAssessmentDoc> {
    const { assessmentId, requirementId, action, correctedStatus, notes, reviewedBy } = params;

    const assessment = await Assessment.findOne({ assessmentId });
    if (!assessment) {
      throw new Error(`Assessment "${assessmentId}" not found`);
    }

    // Persist or update ReviewDecision record
    await ReviewDecision.findOneAndUpdate(
      { assessmentId, requirementId },
      {
        action,
        correctedStatus,
        reviewerNotes: notes,
        reviewedBy: reviewedBy || 'Reviewer'
      },
      { upsert: true, new: true }
    );

    // Update in-memory mapping in Assessment
    assessment.mappings = assessment.mappings.map((m) => {
      if (m.requirementId === requirementId) {
        return {
          ...m,
          userDecision: {
            action,
            correctedStatus,
            notes,
            reviewedAt: new Date(),
            reviewedBy: reviewedBy || 'Reviewer'
          }
        };
      }
      return m;
    });

    // Deterministically recalculate score with new user decision
    assessment.deterministicSummary = scoringService.calculateCompleteness(
      assessment.requirements,
      assessment.mappings
    );

    await assessment.save();
    return assessment;
  }

  /**
   * Updates status of a supporting document (missing / provided / not_applicable)
   */
  public async updateDocumentStatus(params: {
    assessmentId: string;
    documentId: string;
    status: DocumentReviewStatus;
  }): Promise<IAssessmentDoc> {
    const { assessmentId, documentId, status } = params;

    const assessment = await Assessment.findOne({ assessmentId });
    if (!assessment) {
      throw new Error(`Assessment "${assessmentId}" not found`);
    }

    let found = false;
    assessment.missingDocuments = assessment.missingDocuments.map((doc) => {
      if (doc.id === documentId) {
        found = true;
        return { ...doc, status };
      }
      return doc;
    });

    if (!found) {
      throw new Error(`Supporting document "${documentId}" not found in assessment`);
    }

    await assessment.save();
    return assessment;
  }

  /**
   * Compiles the comprehensive final reviewed completeness summary.
   */
  public async getSummary(assessmentId: string): Promise<IAssessmentSummary> {
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment "${assessmentId}" not found`);
    }

    const requirements = assessment.requirements || [];
    const mappings = assessment.mappings || [];
    const mappingMap = new Map<string, IApplicationMapping>();
    for (const m of mappings) {
      mappingMap.set(m.requirementId, m);
    }

    const supportedReqs: Array<{ requirement: IRequirement; mapping: IApplicationMapping }> = [];
    const weakAmbiguousReqs: Array<{ requirement: IRequirement; mapping: IApplicationMapping }> = [];
    const missingReqs: Array<{ requirement: IRequirement; mapping: IApplicationMapping }> = [];

    let confirmedCount = 0;
    let correctedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    for (const req of requirements) {
      const mapping = mappingMap.get(req.id) || {
        requirementId: req.id,
        status: 'missing' as MappingStatus,
        evidence: 'No mapping found',
        evidenceCitation: 'Not cited',
        confidence: 0,
        explanation: 'Requirement not mapped',
        clarificationQuestions: [],
        supportingDocumentsNeeded: []
      };

      const effectiveStatus = scoringService.getEffectiveStatus(mapping);

      if (effectiveStatus === 'supported') {
        supportedReqs.push({ requirement: req, mapping });
      } else if (effectiveStatus === 'weak' || effectiveStatus === 'ambiguous') {
        weakAmbiguousReqs.push({ requirement: req, mapping });
      } else {
        missingReqs.push({ requirement: req, mapping });
      }

      if (mapping.userDecision) {
        if (mapping.userDecision.action === 'confirm') confirmedCount++;
        else if (mapping.userDecision.action === 'correct') correctedCount++;
        else if (mapping.userDecision.action === 'reject') rejectedCount++;
      } else {
        pendingCount++;
      }
    }

    const det = assessment.deterministicSummary || scoringService.calculateCompleteness(requirements, mappings);

    return {
      assessmentId: assessment.assessmentId,
      title: assessment.title,
      completenessScore: det.completenessScore,
      deterministicSummary: det,
      mandatoryRequirementStats: {
        total: det.totalMandatory,
        supported: det.supported,
        weak: det.weak,
        ambiguous: det.ambiguous,
        missing: det.missing,
        unsupported: det.unsupported
      },
      supportedRequirements: supportedReqs,
      weakAmbiguousRequirements: weakAmbiguousReqs,
      missingRequirements: missingReqs,
      unsupportedClaims: assessment.unsupportedClaims || [],
      missingSupportingDocuments: assessment.missingDocuments || [],
      allClarificationQuestions: assessment.clarificationQuestions || [],
      userReviewDecisionsCount: {
        confirmed: confirmedCount,
        corrected: correctedCount,
        rejected: rejectedCount,
        pending: pendingCount
      },
      guidelineVersion: assessment.guidelineVersion,
      applicationVersion: assessment.applicationVersion,
      guidelineFilename: assessment.guidelineFilename,
      applicationFilename: assessment.applicationFilename,
      stale: assessment.stale,
      staleReason: assessment.staleReason,
      timestamp: assessment.updatedAt || assessment.createdAt,
      disclaimer:
        'DISCLAIMER: This report is an automated completeness assessment tool for preliminary draft review against provided guidelines. It does NOT constitute a legal, formal, or authoritative funding-eligibility decision.'
    };
  }
}

export const assessmentService = new AssessmentService();
