# Grant Application Completeness Assistant

An AI-powered, evidence-based pre-submission compliance audit and completeness evaluation platform for grant proposals.

The **Grant Application Completeness Assistant** bridges the gap between complex funding guidelines (RFPs/NOFOs) and draft proposals. It extracts structured criteria from guideline documents, grounds draft application text against those criteria, detects unsupported assertions, flags missing supporting documentation, and calculates a **100% deterministic completeness score** in code—never relying on LLM guesswork for compliance metrics.

---

## Key Features

- **Document Ingestion & Multi-Format Parsing**:
  - Supports PDF, DOCX, and TXT documents.
  - Automatically normalizes extracted text and generates SHA-256 cryptographic hashes for document version tracking.
- **Structured Guideline Extraction**:
  - Deconstructs funding guidelines into atomic, categorized requirements (Eligibility, Project, Budget, Documentation, Submission).
  - Explicitly separates **mandatory requirements** from non-mandatory **recommendations**.
  - Captures exact source citations and text snippets.
- **Evidence-Based Application Mapping**:
  - Maps draft narrative against each requirement into five explicit statuses:
    `supported`, `weak`, `ambiguous`, `missing`, and `unsupported`.
  - Cites exact paragraph/section locations within the application draft.
  - Provides confidence scores and explanations.
- **Deterministic Completeness Scoring Engine**:
  - Calculated strictly in backend TypeScript code—LLMs never calculate the percentage.
  - Transparent point-weighting formula focused on mandatory criteria.
  - Tracks recommendation satisfaction separately so optional suggestions do not penalize mandatory compliance.
- **Unsupported Claim Flagging**:
  - Identifies ungrounded quantitative assertions (e.g. *"served 50,000 students with 100% completion"*) lacking supporting metrics or proof.
  - Assigns severity levels (`high`, `medium`, `low`) with concrete reasons for reviewer caution.
- **Human-in-the-Loop Review & Overrides**:
  - Reviewers can **Confirm**, **Correct** (override status with custom notes), or **Reject** any AI finding.
  - Every decision is recorded with timestamps in MongoDB and instantly triggers a deterministic recalculation of the completeness score.
- **Supporting Document Status Tracking**:
  - Tracks required attachments (Audited Financials, 501(c)(3) Letters, Resumes).
  - Enables reviewers to toggle statuses (`missing`, `provided`, `not_applicable`).
- **Targeted Clarification Question Generator**:
  - Generates actionable, specific questions for weak, ambiguous, or missing items.
  - 1-click clipboard export for inclusion in applicant feedback emails.
- **Document Versioning & Stale Assessment Alerts**:
  - Tracks Guideline and Application version numbers.
  - If a newer document version or modified content is uploaded, previous assessments are flagged as **STALE** with prominent UI warning banners.
- **Reviewed Summary Report & Export**:
  - Generates a printer-friendly completeness certificate.
  - Includes an official non-legal advisory disclaimer.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Fast, responsive single-page application |
| **Styling** | Tailwind CSS, Lucide React | Modern, high-density professional dashboard |
| **Backend** | Node.js, Express, TypeScript | Modular layered REST architecture |
| **Database** | MongoDB, Mongoose | Document versioning, assessments, and review decisions |
| **AI Engine** | Google Gemini (`@google/generative-ai`) | Structured JSON generation with strict Zod validation & auto-repair |
| **Parsing** | `pdf-parse`, `mammoth` | In-memory stream extraction for PDF, DOCX, and TXT |
| **Testing** | Jest, ts-jest, Supertest | Unit & integration tests for scoring, stale detection, schemas, and REST endpoints |
| **Containers**| Docker, Docker Compose | Multi-stage production container builds |

---

## Architecture

```
grant-completeness-assistant/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment & MongoDB connection with in-memory fallback
│   │   ├── controllers/        # HTTP controllers (clean separation of concerns)
│   │   ├── middleware/         # Centralized error handling & Multer upload filter
│   │   ├── models/             # Mongoose schemas (Guideline, Application, Requirement, Assessment, ReviewDecision)
│   │   ├── routes/             # REST API route definitions
│   │   ├── services/
│   │   │   ├── ai/             # Gemini service, prompts, and Zod schemas
│   │   │   ├── assessment/     # Deterministic scoring & assessment orchestrator
│   │   │   └── document/       # Text extractor (PDF, DOCX, TXT)
│   │   ├── tests/              # Jest test suites (scoring, stale detection, AI validation, REST APIs)
│   │   ├── types/              # Domain TypeScript interfaces
│   │   ├── utils/              # Logger, cryptographic hashing, and response helpers
│   │   ├── validators/         # Zod request validators
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Gauge, MappingCard, Badges, Modals)
│   │   ├── pages/              # UploadPage, DashboardPage, HistoryPage
│   │   ├── services/           # Axios REST API client
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── App.tsx             # Root application & navigation
│   │   └── main.tsx            # React DOM mounting
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── sample_documents/           # Realistic sample guidelines & draft proposals
├── docker-compose.yml          # One-click multi-container stack
├── .env.example
└── README.md
```

---

## Deterministic Scoring Formula

To ensure consistency, auditability, and regulatory trust, the AI **never** calculates the final completeness percentage. All scores are computed deterministically in `backend/src/services/assessment/scoring.service.ts`:

### 1. Scope
The core score reflects **Mandatory Requirements** only. Optional recommendations are tracked separately as a supplemental metric so non-mandatory advice never lowers the applicant's mandatory compliance rating.

### 2. Effective Status Determination
User review actions override AI mappings:
- **Confirm**: Uses AI status.
- **Correct**: Uses reviewer's chosen `correctedStatus`.
- **Reject**: Defaults to `missing` (0 points) unless user selects an alternative.

### 3. Status Point Weights
| Status | Weight | Definition |
|---|---|---|
| `supported` | **1.0 pt** | Explicit, verifiable evidence satisfies the requirement. |
| `weak` | **0.4 pt** | Evidence is mentioned or partial, but lacks specifics or metrics. |
| `ambiguous` | **0.2 pt** | Information is confusing, contradictory, or vague. |
| `missing` | **0.0 pt** | Requirement is unaddressed in the application draft. |
| `unsupported` | **0.0 pt** | Assertions made without grounding or proof. |

### 4. Mathematical Formula
$$\text{Completeness Score (\%)} = \left( \frac{\sum \text{Weights of Effective Mandatory Requirements}}{\text{Total Mandatory Requirements}} \right) \times 100$$

*(Rounded to 1 decimal place. If no mandatory requirements exist, defaults to 100%).*

$$\text{Recommendation Score (\%)} = \left( \frac{\text{Supported Recommendations}}{\text{Total Recommendations}} \right) \times 100$$

---

## Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)
- MongoDB (optional—the backend automatically falls back to an embedded in-memory MongoDB in development mode if a local instance is not running!)

---

### Local Installation & Running

#### 1. Configure Environment Variables
Copy `.env.example` into `.env` (or configure in `backend/.env`):
```bash
cp .env.example .env
```
Edit `.env` and add your Google Gemini API key:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/grant_completeness_db
GEMINI_API_KEY=AIzaSy... # Optional: Realistic mock analysis runs automatically if omitted
GEMINI_MODEL=gemini-1.5-flash
FRONTEND_URL=http://localhost:5173
```

#### 2. Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
The backend starts at `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

#### 3. Install & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Quick 1-Click Demo Evaluation
On the **New Assessment** page, click the **"Load Sample Data"** button at the top. This instantly populates:
1. `sample_documents/sample_guideline.txt` (STEM Innovation Grant Guidelines)
2. `sample_documents/sample_draft_application.txt` (Project TechForward Youth draft proposal)

Click **"Start Completeness Analysis"** to see the full AI pipeline, evidence citations, unsupported claims detection, and deterministic scoring in action!

---

## Docker Deployment

To launch the full production stack (MongoDB, Backend, and Nginx-served Frontend):

```bash
docker-compose up --build
```

- Frontend: `http://localhost` (Port 80)
- Backend API: `http://localhost:5000/api`
- MongoDB: `localhost:27017`

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/assessments` | Upload documents (multipart/form-data) or raw text and run completeness analysis |
| `GET` | `/api/assessments` | List all past assessments |
| `GET` | `/api/assessments/:id` | Get full assessment details, requirements, and mappings |
| `GET` | `/api/assessments/:id/requirements` | Get extracted requirements list |
| `GET` | `/api/assessments/:id/mappings` | Get evidence mappings list |
| `PATCH`| `/api/assessments/:id/mappings/:reqId` | Submit user review decision (`confirm`, `correct`, `reject`) and recalculate score |
| `POST` | `/api/assessments/:id/recalculate` | Deterministically recalculate score using current review decisions |
| `PATCH`| `/api/assessments/:id/documents/:docId/status`| Update supporting document status (`missing`, `provided`, `not_applicable`) |
| `GET` | `/api/assessments/:id/summary` | Get final reviewed completeness summary with statistics |
| `GET` | `/api/health` | Service health status |

### Sample Review Decision Payload
`PATCH /api/assessments/:id/mappings/:requirementId`
```json
{
  "action": "correct",
  "correctedStatus": "supported",
  "notes": "Reviewed Appendix A: valid 501(c)(3) determination letter found.",
  "reviewedBy": "Senior Grant Officer"
}
```

---

## Automated Testing

The backend includes a comprehensive suite of unit and integration tests covering deterministic scoring, stale detection, AI validation, and REST API routes with zero reliance on live external API credits:

```bash
cd backend
npm test
```

### Tested Scenarios:
1. **Deterministic Completeness Calculation**: Evaluates 100%, 0%, and fractional scores with weak (0.4) and ambiguous (0.2) weights.
2. **Mandatory vs. Recommendation Handling**: Proves that optional recommendations do not penalize the core mandatory compliance score.
3. **Review Overrides**: Validates that user confirmation, correction, and rejection dynamically update effective scores.
4. **Stale Detection**: Verifies that uploading modified guideline or application text sets `stale: true` with a detailed rationale.
5. **AI Schema Validation**: Tests Zod schema enforcement and rejects invalid enums or missing fields.
6. **API Integration**: Validates file uploads, error handling, status updates, and summary compilation.

---

## Responsible AI & Legal Disclaimer

- **Grounding Principle**: The AI prompts explicitly instruct the model to only use evidence directly stated in the submitted draft. The system never invents citations or assumes unmentioned facts.
- **Distinction of Unsubstantiated Claims**: Claims asserting quantitative outcomes without verifiable source data are flagged as unsupported claims rather than merely missing evidence.
- **Non-Authoritative Advisory Tool**: This software is intended exclusively as a preparatory completeness checklist and evidence mapping tool for applicants and grant writers.
- **Official Disclaimer**:
  > *DISCLAIMER: This application does NOT provide legal advice or official funding eligibility determinations. Final grant award decisions rest exclusively with the designated funding agency or evaluation committee.*
