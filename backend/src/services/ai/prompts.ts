import { IRequirement } from '../../types';

export const SYSTEM_DISCLAIMER_PROMPT = `
You are an expert, objective Grant Application Completeness Reviewer.
Your role is to strictly analyze draft application text against grant guideline text.

CRITICAL INSTRUCTIONS & CONSTRAINTS:
1. ONLY use information grounded directly in the provided documents. NEVER invent, hallucinate, assume, or extrapolate facts.
2. NEVER invent citations or document sections. If something is missing, state clearly that it was not found.
3. CLEARLY DISTINGUISH:
   - Mandatory requirements: strict rules that an applicant "must", "shall", or "is required to" fulfill.
   - Recommendations: optional guidance, best practices, or suggestions ("should", "encouraged to", "may").
4. CLEARLY DISTINGUISH:
   - Missing evidence: requirement was not mentioned or addressed in the draft.
   - Unsupported claims: bold or factual assertions made in the application (e.g., "served 50,000 students", "100% success rate") that lack substantiating data, methodology, or proof in the text.
5. NEVER make authoritative legal decisions or official funding eligibility rulings. Provide evidence-based analysis only.
6. If evidence is vague, contradictory, or ungrounded, mark it as 'weak' or 'ambiguous'.
7. Return ONLY valid JSON matching the requested JSON schema. Do not wrap in markdown code blocks if raw json is requested.
`;

export function buildExtractRequirementsPrompt(guidelineText: string): string {
  return `
${SYSTEM_DISCLAIMER_PROMPT}

TASK: Extract all requirements and recommendations from the following grant/funding guideline document.

GUIDELINE TEXT:
"""
${guidelineText}
"""

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Short descriptive title of requirement",
      "description": "Clear explanation of what the guideline demands or recommends",
      "category": "e.g. Eligibility, Technical Proposal, Budget & Finance, Governance, Reporting, Timeline",
      "mandatory": true, // true if strictly required ("must", "shall", "mandatory"), false if recommendation/guidance ("recommended", "should", "suggested")
      "requirementType": "eligibility" | "submission" | "documentation" | "project" | "budget" | "recommendation" | "other",
      "sourceCitation": "e.g., Section 2.1 'Applicant Eligibility', Page 3",
      "sourceText": "Short exact snippet from the guideline demonstrating this requirement"
    }
  ]
}

Ensure all significant rules, documentation mandates, eligibility criteria, and key recommendations are captured.
`;
}

export function buildMapApplicationPrompt(
  requirements: IRequirement[],
  applicationText: string
): string {
  return `
${SYSTEM_DISCLAIMER_PROMPT}

TASK: Map each guideline requirement against the draft grant application.
Assess the level of evidence provided in the application for each requirement.

GUIDELINE REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

DRAFT APPLICATION TEXT:
"""
${applicationText}
"""

STATUS DEFINITIONS:
- "supported": Explicit, credible, verifiable evidence addressing the requirement is present in the draft.
- "weak": Evidence is mentioned or attempted, but lacks specifics, metrics, depth, or required details.
- "ambiguous": The application text is confusing, vague, or contains conflicting statements regarding the requirement.
- "missing": The application completely fails to address or mention this requirement.
- "unsupported": A claim of compliance or past achievement is stated, but zero supporting data or proof is provided.

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "mappings": [
    {
      "requirementId": "REQ-001",
      "status": "supported" | "weak" | "ambiguous" | "missing" | "unsupported",
      "evidence": "Summary of what the application text says or provides regarding this requirement",
      "evidenceCitation": "Section, heading, or paragraph in the draft application where evidence was found, or 'Not found in draft application'",
      "confidence": 0.85, // float between 0.0 and 1.0 indicating confidence in this evaluation
      "explanation": "Objective reasoning explaining why this status was assigned",
      "clarificationQuestions": [
        // 1 to 3 specific, actionable clarification questions if status is weak, ambiguous, or missing. Empty array if supported.
      ],
      "supportingDocumentsNeeded": [
        // Names of any supporting documents needed to substantiate this requirement (e.g. 'Audited Financial Statements FY2023', 'Letters of Support', 'IRS 501(c)(3) Determination Letter').
      ]
    }
  ]
}

Map EVERY requirement listed above.
`;
}

export function buildUnsupportedClaimsPrompt(applicationText: string): string {
  return `
${SYSTEM_DISCLAIMER_PROMPT}

TASK: Identify unsupported claims in the draft application.
Look specifically for:
- Quantitative claims without substantiation (e.g. "We have impacted 100,000 lives", "99% satisfaction rate") without source or validation.
- Assertions of formal partnerships, endorsements, or certifications not backed by attached documentation or evidence.
- Claims of capacity or proprietary technology without proof.

APPLICATION TEXT:
"""
${applicationText}
"""

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "claims": [
    {
      "id": "CLAIM-001",
      "claim": "Exact quote or close paraphrase of the unsubstantiated claim made in the application",
      "location": "Section or paragraph where the claim appears",
      "reason": "Detailed explanation of why this claim is considered unsupported or risky for reviewers",
      "severity": "high" | "medium" | "low"
    }
  ]
}

If no unsubstantiated claims are found, return "claims": [].
`;
}

export function buildClarificationQuestionsPrompt(
  weakOrMissingMappings: Array<{
    requirementId: string;
    requirementTitle: string;
    status: string;
    explanation: string;
  }>
): string {
  return `
${SYSTEM_DISCLAIMER_PROMPT}

TASK: Generate focused, professional clarification questions for an applicant to help them address missing, weak, or ambiguous items before final submission.

ITEMS NEEDING CLARIFICATION:
${JSON.stringify(weakOrMissingMappings, null, 2)}

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "questions": [
    {
      "requirementId": "REQ-001",
      "requirementTitle": "Title of the requirement",
      "question": "Specific, actionable question asking for concrete data, documentation, or clarification"
    }
  ]
}
`;
}
