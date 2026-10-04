import React from 'react';
import { Sparkles, FileText } from 'lucide-react';

interface SampleDataSelectorProps {
  onLoadSample: (guidelineText: string, applicationText: string, title: string) => void;
}

export const SAMPLE_GUIDELINE_TEXT = `================================================================================
COMMUNITY STEM INNOVATION & WORKFORCE GRANT - FUNDING GUIDELINES FY2025
Catalog of Federal/State Assistance (CFSA) #84.215
================================================================================

1. ELIGIBILITY REQUIREMENTS (MANDATORY)
1.1 Legal Status: Applicants must be a registered 501(c)(3) tax-exempt non-profit organization, accredited public school district, or public higher education institution.
1.2 Operating History: The applicant must demonstrate at least two (2) continuous years of verified educational program delivery prior to the application deadline.
1.3 Target Population: Programs must primarily serve historically underrepresented K-12 students or underserved rural communities.

2. SUBMISSION & FORMAT REQUIREMENTS (MANDATORY)
2.1 Narrative Page Limit: The core project narrative must not exceed fifteen (15) single-spaced pages in 12pt font with 1-inch margins.
2.2 Deadline: Complete electronic submissions must be received no later than 5:00 PM EST on November 15, 2025.

3. PROJECT DESIGN & MILESTONES (MANDATORY)
3.1 Needs Assessment & Objectives: The proposal must provide local educational performance metrics and state 3-5 specific, measurable, achievable, relevant, and time-bound (SMART) objectives.
3.2 Implementation Timeline & Milestones: A phased 12-month delivery schedule with quarterly milestones and identified staff leads must be included.
3.3 Evaluation Methodology: Proposals must define a standardized quantitative and qualitative assessment framework to measure STEM engagement and learning outcomes.

4. BUDGET & FINANCIAL REQUIREMENTS (MANDATORY)
4.1 Detailed Itemized Line-Item Budget: Applicants must submit a comprehensive 12-month itemized budget spreadsheet detailing Personnel, Equipment, Supplies, Travel, and Contractual costs.
4.2 Budget Narrative: Written justifications are required for every line item exceeding $5,000 in value, explaining basis of estimate.
4.3 Indirect Cost Limitation: Indirect or administrative overhead costs must not exceed 10% of total direct project costs.

5. REQUIRED SUPPORTING DOCUMENTATION (MANDATORY)
5.1 Tax Determination: Official IRS 501(c)(3) determination letter or proof of public entity status.
5.2 Audited Financial Statements: Independently audited financial statements or certified CPA financial reviews for the two (2) most recent fiscal years.
5.3 Key Personnel Credentials: Curriculum Vitae (CV) or resumes of the Project Director and lead instructors (max 2 pages per individual).

6. RECOMMENDED GUIDANCE & BEST PRACTICES (NON-MANDATORY)
6.1 Community Partner Letters of Commitment: Applicants are strongly encouraged to submit signed letters of commitment from at least two local industry or community partners.
6.2 Post-Grant Sustainability Strategy: Proposals should outline diversified revenue streams or institutional adoption plans to sustain program activities beyond the 12-month grant lifecycle.
6.3 Open Educational Resources: Dissemination of developed curriculum modules under Creative Commons or open-source licenses is recommended.`;

export const SAMPLE_APPLICATION_TEXT = `================================================================================
GRANT APPLICATION DRAFT: PROJECT TECHFORWARD YOUTH
Submitted by: Youth Horizon Initiative (YHI)
Proposed Project Title: "Empowering Rural Youth Through Hands-On Robotics"
================================================================================

SECTION 1: ORGANIZATIONAL BACKGROUND & ELIGIBILITY
Youth Horizon Initiative (YHI) is a regional non-profit organization established in 2019, officially recognized as a tax-exempt 501(c)(3) entity by the Internal Revenue Service (EIN: 12-3456789). Over our five years of continuous operation, YHI has delivered supplemental STEM enrichment programs to low-income middle school students.

We have served over 50,000 students across the state with a 100% program completion rate and zero dropouts. Our proprietary hands-on robotics workshops are recognized as the number-one premier experiential education model in the region.

SECTION 2: PROJECT DESIGN & TIMELINE
"Project TechForward" will expand weekend robotics and coding bootcamps to 600 middle school students in three underserved rural counties.
Specific SMART Objectives:
1. Recruit 600 students (at least 55% female or minority) across 6 school clusters by Month 2.
2. Deliver 120 hours of instruction per cohort using open-source microcontrollers by Month 8.
3. Achieve an 85% score on post-program computational thinking assessments by Month 12.

Implementation Milestones:
- Q1 (Months 1-3): Curriculum adaptation, hiring 4 mentor instructors, school district enrollment kickoff. Lead: Dr. Elena Vance.
- Q2 (Months 4-6): Delivery of Phase I robotics challenges; mid-term learner feedback surveys. Lead: Marcus Thorne.
- Q3 (Months 7-9): Phase II competitive hackathon events across partner counties. Lead: Marcus Thorne.
- Q4 (Months 10-12): Capstone showcase, outcome evaluation report, and final participant certifications. Lead: Dr. Elena Vance.

SECTION 3: PERSONNEL & GOVERNANCE
Project Director: Dr. Elena Vance, Ed.D in Instructional Technology with 12 years of STEM curriculum leadership.
Technical Lead: Marcus Thorne, B.S. Robotics Engineering, former lead robotics mentor.
Biographical overviews are provided; full 2-page curriculum vitae are included in Appendix A.

SECTION 4: BUDGET OVERVIEW
Youth Horizon Initiative requests a total funding allocation of $185,000 for the 12-month program.
Estimated Budget Distribution:
- Staffing & Instructors: $110,000
- Robotics Hardware Kits & Consumables: $45,000
- Student Transportation & Nutrition: $15,000
- Administrative Support: $15,000
Total Request: $185,000.
(Note: Detailed spreadsheet sub-allocations and narrative justifications for supplies will be finalized upon award notification).

SECTION 5: ATTACHMENTS & ASSURANCES
- IRS 501(c)(3) Determination Letter: [Attached as Appendix B]
- Resumes of Key Personnel: [Attached as Appendix A]
- Financial Disclosures: Our annual budget is reviewed by our Board Treasurer. Audited formal CPA statements for FY2022-2023 are currently being scheduled with an independent accounting firm.
- Letters of Support: Discussions are ongoing with local county school superintendents; formal letters of commitment will follow.`;

export const SampleDataSelector: React.FC<SampleDataSelectorProps> = ({ onLoadSample }) => {
  return (
    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-sky-600 text-white rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-sky-950">
            Quick-Test: Load Sample STEM Grant & Draft Proposal
          </h4>
          <p className="text-2xs text-sky-800">
            Populate sample documents with intentional evidence gaps, missing documents, and unsupported claims for immediate assessment.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onLoadSample(
            SAMPLE_GUIDELINE_TEXT,
            SAMPLE_APPLICATION_TEXT,
            'STEM Innovation Grant Assessment'
          )
        }
        className="inline-flex items-center px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex-shrink-0"
      >
        <FileText className="w-3.5 h-3.5 mr-1.5" />
        Load Sample Data
      </button>
    </div>
  );
};
