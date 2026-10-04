import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { IRequirement, IApplicationMapping, IUnsupportedClaim } from '../../types';
import {
  RequirementsExtractionResponseSchema,
  ApplicationMappingResponseSchema,
  UnsupportedClaimsResponseSchema,
  ClarificationQuestionsResponseSchema,
  ExtractedRequirementsResult,
  ApplicationMappingsResult,
  UnsupportedClaimsResult,
  ClarificationQuestionsResult
} from './schemas';
import {
  buildExtractRequirementsPrompt,
  buildMapApplicationPrompt,
  buildUnsupportedClaimsPrompt,
  buildClarificationQuestionsPrompt
} from './prompts';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      logger.info('Gemini AI service initialized with provided API key.');
    } else {
      logger.warn(
        'No valid GEMINI_API_KEY provided in environment. Realistic mock AI analysis mode will be active for development and testing.'
      );
    }
  }

  public isLiveAiAvailable(): boolean {
    return this.genAI !== null;
  }

  /**
   * Helper to clean markdown JSON fencing if returned
   */
  private cleanJsonString(raw: string): string {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean.trim();
  }

  /**
   * Executes a Gemini request with structured JSON expectation,
   * with 1 retry on invalid JSON or schema validation failure.
   */
  private async executeWithRetry<T>(
    prompt: string,
    schema: any,
    operationName: string
  ): Promise<T> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured.');
    }

    const model = this.genAI.getGenerativeModel({
      model: config.geminiModel,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    // Attempt 1
    try {
      logger.info(`[AI ${operationName}] Sending prompt to Gemini (${config.geminiModel})...`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = this.cleanJsonString(text);
      const parsedJson = JSON.parse(cleaned);
      const validated = schema.parse(parsedJson);
      logger.info(`[AI ${operationName}] Validated response successfully.`);
      return validated;
    } catch (firstError: any) {
      logger.warn(
        `[AI ${operationName}] Attempt 1 failed (${firstError.message}). Retrying once with strict repair prompt...`
      );

      // Attempt 2: Strict repair prompt
      try {
        const repairPrompt = `
PREVIOUS ATTEMPT FAILED WITH ERROR: ${firstError.message}
CRITICAL: You MUST return strictly valid, well-formed JSON matching the exact schema requested without any extra characters, commentary, or invalid syntax.

ORIGINAL PROMPT:
${prompt}
`;
        const retryResult = await model.generateContent(repairPrompt);
        const retryText = retryResult.response.text();
        const retryCleaned = this.cleanJsonString(retryText);
        const retryJson = JSON.parse(retryCleaned);
        const retryValidated = schema.parse(retryJson);
        logger.info(`[AI ${operationName}] Attempt 2 succeeded after repair prompt.`);
        return retryValidated;
      } catch (retryError: any) {
        logger.error(
          `[AI ${operationName}] Attempt 2 failed: ${retryError.message}`
        );
        throw new Error(
          `AI service failed to produce valid structured response for ${operationName}: ${retryError.message}`
        );
      }
    }
  }

  // 1. Extract Requirements
  public async extractRequirements(guidelineText: string): Promise<IRequirement[]> {
    if (!this.genAI) {
      return this.mockExtractRequirements(guidelineText);
    }

    const prompt = buildExtractRequirementsPrompt(guidelineText);
    const data = await this.executeWithRetry<ExtractedRequirementsResult>(
      prompt,
      RequirementsExtractionResponseSchema,
      'extractRequirements'
    );
    return data.requirements as IRequirement[];
  }

  // 2. Map Application to Requirements
  public async mapApplicationToRequirements(
    requirements: IRequirement[],
    applicationText: string
  ): Promise<IApplicationMapping[]> {
    if (!this.genAI) {
      return this.mockMapApplicationToRequirements(requirements, applicationText);
    }

    const prompt = buildMapApplicationPrompt(requirements, applicationText);
    const data = await this.executeWithRetry<ApplicationMappingsResult>(
      prompt,
      ApplicationMappingResponseSchema,
      'mapApplicationToRequirements'
    );
    return data.mappings as IApplicationMapping[];
  }

  // 3. Detect Unsupported Claims
  public async detectUnsupportedClaims(applicationText: string): Promise<IUnsupportedClaim[]> {
    if (!this.genAI) {
      return this.mockDetectUnsupportedClaims(applicationText);
    }

    const prompt = buildUnsupportedClaimsPrompt(applicationText);
    const data = await this.executeWithRetry<UnsupportedClaimsResult>(
      prompt,
      UnsupportedClaimsResponseSchema,
      'detectUnsupportedClaims'
    );
    return data.claims as IUnsupportedClaim[];
  }

  // 4. Generate Clarification Questions
  public async generateClarificationQuestions(
    weakOrMissingItems: Array<{
      requirementId: string;
      requirementTitle: string;
      status: string;
      explanation: string;
    }>
  ): Promise<Array<{ requirementId: string; requirementTitle: string; question: string }>> {
    if (weakOrMissingItems.length === 0) {
      return [];
    }

    if (!this.genAI) {
      return this.mockClarificationQuestions(weakOrMissingItems);
    }

    const prompt = buildClarificationQuestionsPrompt(weakOrMissingItems);
    const data = await this.executeWithRetry<ClarificationQuestionsResult>(
      prompt,
      ClarificationQuestionsResponseSchema,
      'generateClarificationQuestions'
    );
    return data.questions;
  }

  // ==========================================
  // Mock implementations for testing / offline demo
  // ==========================================
  public mockExtractRequirements(text: string): IRequirement[] {
    logger.info('Using realistic mock requirement extraction');
    return [
      {
        id: 'REQ-001',
        title: 'Non-Profit 501(c)(3) Eligibility Status',
        description: 'Applicants must be a registered 501(c)(3) tax-exempt non-profit organization or accredited academic institution.',
        category: 'Eligibility',
        mandatory: true,
        requirementType: 'eligibility',
        sourceCitation: 'Section 1.2: Eligible Entities, Page 2',
        sourceText: 'Applicants must possess valid 501(c)(3) tax exemption status at the time of application submission.'
      },
      {
        id: 'REQ-002',
        title: 'Detailed Itemized Line-Item Budget',
        description: 'A comprehensive 12-month itemized project budget must be provided with narrative justifications for all line items over $5,000.',
        category: 'Budget & Finance',
        mandatory: true,
        requirementType: 'budget',
        sourceCitation: 'Section 4.1: Budgetary Requirements, Page 7',
        sourceText: 'A detailed 12-month line-item budget along with clear cost justifications for all major expenditures is mandatory.'
      },
      {
        id: 'REQ-003',
        title: 'Project Timeline and Milestone Schedule',
        description: 'A phased project delivery timeline with quarterly milestones, deliverables, and designated responsible leads.',
        category: 'Project Execution',
        mandatory: true,
        requirementType: 'project',
        sourceCitation: 'Section 3.3: Project Deliverables, Page 5',
        sourceText: 'Applications must include a quarterly milestone schedule defining specific deliverables and completion dates.'
      },
      {
        id: 'REQ-004',
        title: 'Audited Financial Statements (Last 2 Fiscal Years)',
        description: 'Independent audited financial statements or certified financial reviews for the preceding two fiscal years must be submitted.',
        category: 'Documentation',
        mandatory: true,
        requirementType: 'documentation',
        sourceCitation: 'Section 5.2: Required Attachments, Page 9',
        sourceText: 'Applicants must submit independently audited financial statements for the two most recent fiscal years.'
      },
      {
        id: 'REQ-005',
        title: 'Key Personnel Resumes and Qualifications',
        description: 'Curriculum Vitae (CV) or resumes of the Project Director and senior key personnel demonstrating relevant sector expertise.',
        category: 'Documentation',
        mandatory: true,
        requirementType: 'documentation',
        sourceCitation: 'Section 5.4: Personnel Qualifications, Page 10',
        sourceText: 'Resumes or CVs of the Principal Investigator / Project Director must be attached.'
      },
      {
        id: 'REQ-006',
        title: 'Community Partnership Letters of Commitment',
        description: 'Applicants are strongly recommended to include signed letters of commitment from at least two local community partner organizations.',
        category: 'Partnerships & Collaboration',
        mandatory: false,
        requirementType: 'recommendation',
        sourceCitation: 'Section 3.6: Community Partnerships, Page 6',
        sourceText: 'Applicants are encouraged to provide letters of support or commitment from active partner institutions.'
      },
      {
        id: 'REQ-007',
        title: 'Sustainability and Long-Term Impact Plan',
        description: 'A plan demonstrating how the project will maintain operations and funding after the 12-month grant period ends.',
        category: 'Sustainability',
        mandatory: false,
        requirementType: 'recommendation',
        sourceCitation: 'Section 6.1: Post-Grant Viability, Page 11',
        sourceText: 'Proposals should outline ongoing sustainability and diverse revenue sources beyond the grant duration.'
      }
    ];
  }

  public mockMapApplicationToRequirements(
    requirements: IRequirement[],
    applicationText: string
  ): IApplicationMapping[] {
    logger.info('Using realistic mock application mapping');
    const lower = applicationText.toLowerCase();

    return requirements.map((req) => {
      if (req.id === 'REQ-001') {
        const mentions501c3 = lower.includes('501(c)(3)') || lower.includes('tax-exempt') || lower.includes('non-profit');
        return {
          requirementId: req.id,
          status: mentions501c3 ? 'supported' : 'missing',
          evidence: mentions501c3
            ? 'Application explicitly identifies organization as a registered 501(c)(3) non-profit entity.'
            : 'No mention of 501(c)(3) tax status or organizational legal structure found.',
          evidenceCitation: mentions501c3 ? 'Section 1: Organizational Overview' : 'Not found in draft application',
          confidence: 0.95,
          explanation: mentions501c3
            ? 'Entity status is confirmed in organizational introduction.'
            : 'Crucial legal eligibility prerequisite is absent.',
          clarificationQuestions: mentions501c3
            ? []
            : ['Please provide official IRS 501(c)(3) determination letter or proof of eligible status.'],
          supportingDocumentsNeeded: mentions501c3 ? ['IRS 501(c)(3) Determination Letter'] : ['Proof of Non-Profit Registration']
        };
      }

      if (req.id === 'REQ-002') {
        const hasBudget = lower.includes('budget') || lower.includes('$') || lower.includes('cost');
        const hasDetailedItems = lower.includes('itemized') || lower.includes('line-item') || lower.includes('personnel cost');
        return {
          requirementId: req.id,
          status: hasDetailedItems ? 'supported' : hasBudget ? 'weak' : 'missing',
          evidence: hasBudget
            ? 'Draft provides high-level funding request figures ($250,000 total) but lacks broken-down line item costs.'
            : 'No budget or financial allocation section was included.',
          evidenceCitation: hasBudget ? 'Section 4: Financial Summary' : 'Not found in draft application',
          confidence: 0.88,
          explanation: hasDetailedItems
            ? 'Itemized breakdown is present.'
            : hasBudget
            ? 'Total requested amount is stated, but individual cost categories and justifications over $5,000 are omitted.'
            : 'Mandatory budget breakdown is missing.',
          clarificationQuestions: hasDetailedItems
            ? []
            : [
                'Please supply a categorized line-item breakdown (Personnel, Equipment, Travel, Indirect).',
                'What is the basis of estimation for project operational expenses?'
              ],
          supportingDocumentsNeeded: ['Itemized 12-Month Project Budget Spreadsheet']
        };
      }

      if (req.id === 'REQ-003') {
        const hasTimeline = lower.includes('timeline') || lower.includes('quarter') || lower.includes('milestone') || lower.includes('phase');
        return {
          requirementId: req.id,
          status: hasTimeline ? 'supported' : 'weak',
          evidence: hasTimeline
            ? 'Quarterly milestone schedule from Q1 to Q4 with key deliverables described.'
            : 'General project activities are mentioned without concrete calendar milestones or target dates.',
          evidenceCitation: hasTimeline ? 'Section 3.2: Implementation Plan & Milestones' : 'Section 3: Project Narrative',
          confidence: 0.85,
          explanation: hasTimeline
            ? 'Satisfies the phased delivery schedule requirement.'
            : 'Lacks measurable quarterly deadlines and responsible staff leads.',
          clarificationQuestions: hasTimeline
            ? []
            : ['What are the specific quarterly milestone dates and deliverable completion targets?'],
          supportingDocumentsNeeded: []
        };
      }

      if (req.id === 'REQ-004') {
        const hasAudit = lower.includes('audited') || lower.includes('financial statement');
        return {
          requirementId: req.id,
          status: hasAudit ? 'supported' : 'missing',
          evidence: hasAudit
            ? 'Audit mentions referenced in financial disclosure.'
            : 'No audited financial statements or attachment references detected in the text.',
          evidenceCitation: hasAudit ? 'Section 5: Financial Attachments' : 'Not found in draft application',
          confidence: 0.92,
          explanation: 'Independent audit reports are a mandatory submission document.',
          clarificationQuestions: [
            'Please confirm whether audited financial statements for FY2022 and FY2023 will be attached to the final submission.'
          ],
          supportingDocumentsNeeded: ['Audited Financial Statements (Last 2 Years)']
        };
      }

      if (req.id === 'REQ-005') {
        const hasPersonnel = lower.includes('director') || lower.includes('team') || lower.includes('resume') || lower.includes('cv');
        return {
          requirementId: req.id,
          status: hasPersonnel ? 'supported' : 'weak',
          evidence: hasPersonnel
            ? 'Project leads and relevant biographical summaries are outlined in the staffing section.'
            : 'Brief staff titles mentioned without full qualifications or attached resumes.',
          evidenceCitation: hasPersonnel ? 'Section 2: Team & Governance' : 'Section 2: Staffing',
          confidence: 0.89,
          explanation: 'Qualifications are detailed; ensure formal resumes are compiled in appendices.',
          clarificationQuestions: hasPersonnel ? [] : ['Please attach standard 2-page CVs for Project Director and Co-Investigators.'],
          supportingDocumentsNeeded: ['Key Personnel Resumes / CVs']
        };
      }

      if (req.id === 'REQ-006') {
        const hasPartners = lower.includes('partner') || lower.includes('collaboration') || lower.includes('coalition');
        return {
          requirementId: req.id,
          status: hasPartners ? 'supported' : 'missing',
          evidence: hasPartners
            ? 'Application references collaborative work with regional community centers.'
            : 'No community partners or collaboration agreements noted.',
          evidenceCitation: hasPartners ? 'Section 3.5: Partnerships' : 'Not found in draft application',
          confidence: 0.8,
          explanation: 'Non-mandatory recommendation; strengthening partner letters elevates proposal score.',
          clarificationQuestions: hasPartners ? [] : ['Are formal letters of commitment available from partner organizations?'],
          supportingDocumentsNeeded: ['Letters of Commitment / Support']
        };
      }

      // Default for REQ-007 or other
      return {
        requirementId: req.id,
        status: 'weak',
        evidence: 'Brief mention of continuing project after funding cycle.',
        evidenceCitation: 'Section 4.3: Future Directions',
        confidence: 0.75,
        explanation: 'Future sustainability plan is noted in general terms without concrete revenue projections.',
        clarificationQuestions: ['What specific grant, fee-for-service, or donor revenue streams will sustain operations post-grant?'],
        supportingDocumentsNeeded: ['Sustainability Strategy Plan']
      };
    });
  }

  public mockDetectUnsupportedClaims(text: string): IUnsupportedClaim[] {
    logger.info('Using realistic mock unsupported claims detection');
    return [
      {
        id: 'CLAIM-001',
        claim: 'We have served over 50,000 students across the state with a 100% program completion rate.',
        location: 'Section 1: Organizational Background, Paragraph 2',
        reason: 'Large quantitative metric of 50,000 students and extraordinary 100% completion rate presented without citation to historical evaluation reports, demographic data, or methodology.',
        severity: 'high'
      },
      {
        id: 'CLAIM-002',
        claim: 'Our proprietary digital curriculum is recognized as the leading benchmark across the tri-state area.',
        location: 'Section 2: Proposed Methodology, Paragraph 4',
        reason: 'Subjective claim of being the "leading benchmark" without third-party validation, accreditation, or independent comparative study citation.',
        severity: 'medium'
      }
    ];
  }

  public mockClarificationQuestions(
    weakOrMissingItems: Array<{
      requirementId: string;
      requirementTitle: string;
      status: string;
      explanation: string;
    }>
  ): Array<{ requirementId: string; requirementTitle: string; question: string }> {
    return weakOrMissingItems.map((item) => ({
      requirementId: item.requirementId,
      requirementTitle: item.requirementTitle,
      question: `For ${item.requirementTitle} (currently ${item.status}): What specific documentation or quantitative evidence can be added to fully satisfy this requirement?`
    }));
  }
}

export const geminiService = new GeminiService();
