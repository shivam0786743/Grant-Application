import React, { useState } from 'react';
import {
  IAssessment,
  ReviewAction,
  MappingStatus,
  DocumentReviewStatus,
  IAssessmentSummary
} from '../types';
import { api } from '../services/api';
import { AssessmentHeader } from '../components/AssessmentHeader';
import { StaleWarningBanner } from '../components/StaleWarningBanner';
import { CompletenessGauge } from '../components/CompletenessGauge';
import { MappingCard } from '../components/MappingCard';
import { RequirementsList } from '../components/RequirementsList';
import { UnsupportedClaimsList } from '../components/UnsupportedClaimsList';
import { MissingDocsList } from '../components/MissingDocsList';
import { ClarificationQuestionsList } from '../components/ClarificationQuestionsList';
import { FinalSummaryModal } from '../components/FinalSummaryModal';
import {
  Layers,
  FileText,
  AlertOctagon,
  FolderCheck,
  HelpCircle,
  Award,
  CheckCircle2
} from 'lucide-react';

interface DashboardPageProps {
  assessment: IAssessment;
  onUpdateAssessment: (assessment: IAssessment) => void;
  onNavigateToUpload: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  assessment,
  onUpdateAssessment,
  onNavigateToUpload
}) => {
  const [activeTab, setActiveTab] = useState<
    'mappings' | 'requirements' | 'unsupported' | 'documents' | 'clarifications'
  >('mappings');

  const [summaryData, setSummaryData] = useState<IAssessmentSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Recalculate deterministic score
  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      const updatedAssessment = await api.getAssessment(assessment.assessmentId);
      onUpdateAssessment(updatedAssessment);
      showFeedback('Score recalculated using latest review decisions.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Open final summary modal
  const handleOpenSummary = async () => {
    try {
      const summary = await api.getSummary(assessment.assessmentId);
      setSummaryData(summary);
      setIsSummaryOpen(true);
    } catch (err: any) {
      alert('Could not load summary: ' + (err.message || 'Unknown error'));
    }
  };

  // User review decision: Confirm / Correct / Reject
  const handleReviewDecision = async (
    requirementId: string,
    decision: {
      action: ReviewAction;
      correctedStatus?: MappingStatus;
      notes?: string;
      reviewedBy?: string;
    }
  ) => {
    try {
      const updated = await api.updateMappingDecision(
        assessment.assessmentId,
        requirementId,
        decision
      );
      onUpdateAssessment(updated);
      showFeedback(
        `Decision "${decision.action.toUpperCase()}" recorded for requirement ${requirementId}. Score updated!`
      );
    } catch (err: any) {
      alert('Failed to save review decision: ' + (err.message || 'Unknown error'));
    }
  };

  // Update supporting document status
  const handleUpdateDocumentStatus = async (
    documentId: string,
    status: DocumentReviewStatus
  ) => {
    try {
      const updated = await api.updateDocumentStatus(
        assessment.assessmentId,
        documentId,
        status
      );
      onUpdateAssessment(updated);
      showFeedback(`Document marked as "${status.replace('_', ' ')}".`);
    } catch (err: any) {
      alert('Failed to update document: ' + (err.message || 'Unknown error'));
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Build requirement map for easy lookup
  const reqMap = new Map(assessment.requirements.map((r) => [r.id, r]));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackNotice && (
        <div className="fixed bottom-5 right-5 z-40 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Header */}
      <AssessmentHeader
        assessment={assessment}
        onOpenSummary={handleOpenSummary}
        onRecalculate={handleRecalculate}
        isRecalculating={isRecalculating}
      />

      {/* Stale Warning Banner */}
      {assessment.stale && (
        <StaleWarningBanner
          staleReason={assessment.staleReason}
          onReanalyze={onNavigateToUpload}
        />
      )}

      {/* Completeness Gauge */}
      <CompletenessGauge summary={assessment.deterministicSummary} />

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto pb-px text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`py-3 px-1 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'mappings'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Evidence Mappings & Review ({assessment.mappings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-3 px-1 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'requirements'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Guideline Requirements ({assessment.requirements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unsupported')}
            className={`py-3 px-1 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'unsupported'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Unsupported Claims ({assessment.unsupportedClaims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-1 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'documents'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Supporting Docs ({assessment.missingDocuments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clarifications')}
            className={`py-3 px-1 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
              activeTab === 'clarifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Clarification Questions ({assessment.clarificationQuestions.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'mappings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>
                Review AI mappings. Click Confirm to accept, or Correct to override the status with reviewer justification.
              </span>
              <span className="font-medium text-slate-700">
                {assessment.mappings.filter((m) => m.userDecision).length} of{' '}
                {assessment.mappings.length} reviewed by human
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {assessment.mappings.map((mapping) => {
                const req = reqMap.get(mapping.requirementId);
                if (!req) return null;
                return (
                  <MappingCard
                    key={mapping.requirementId}
                    requirement={req}
                    mapping={mapping}
                    onReviewDecision={handleReviewDecision}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <RequirementsList requirements={assessment.requirements} />
        )}

        {activeTab === 'unsupported' && (
          <UnsupportedClaimsList claims={assessment.unsupportedClaims} />
        )}

        {activeTab === 'documents' && (
          <MissingDocsList
            documents={assessment.missingDocuments}
            onUpdateStatus={handleUpdateDocumentStatus}
          />
        )}

        {activeTab === 'clarifications' && (
          <ClarificationQuestionsList questions={assessment.clarificationQuestions} />
        )}
      </div>

      {/* Final Summary Modal */}
      {isSummaryOpen && summaryData && (
        <FinalSummaryModal
          summary={summaryData}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}
    </div>
  );
};
