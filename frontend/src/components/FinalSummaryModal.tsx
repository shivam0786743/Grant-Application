import React from 'react';
import { IAssessmentSummary } from '../types';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  FileCheck,
  Calendar,
  AlertOctagon
} from 'lucide-react';

interface FinalSummaryModalProps {
  summary: IAssessmentSummary;
  onClose: () => void;
}

export const FinalSummaryModal: React.FC<FinalSummaryModalProps> = ({ summary, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const {
    completenessScore,
    deterministicSummary,
    mandatoryRequirementStats,
    supportedRequirements,
    weakAmbiguousRequirements,
    missingRequirements,
    unsupportedClaims,
    missingSupportingDocuments,
    allClarificationQuestions,
    userReviewDecisionsCount,
    guidelineFilename,
    guidelineVersion,
    applicationFilename,
    applicationVersion,
    stale,
    staleReason,
    timestamp,
    disclaimer
  } = summary;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-600 text-white rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Official Reviewed Completeness Summary
              </h2>
              <p className="text-xs text-slate-500">
                Final deterministically calculated report with reviewer decisions applied
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print-page">
          {/* Stale Alert if applicable */}
          {stale && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">NOTICE: STALE ASSESSMENT</span>
                <p className="mt-0.5">{staleReason}</p>
              </div>
            </div>
          )}

          {/* Report Header Metadata */}
          <div className="border-b border-slate-200 pb-5">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Grant Application Completeness Evaluation
            </h1>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Guideline Document:</span>
                <span className="font-semibold text-slate-800">{guidelineFilename}</span>
                <span className="ml-1.5 font-mono text-sky-700">(v{guidelineVersion})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Draft Application:</span>
                <span className="font-semibold text-slate-800">{applicationFilename}</span>
                <span className="ml-1.5 font-mono text-emerald-700">(v{applicationVersion})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Assessment Timestamp:</span>
                <span className="font-medium text-slate-800">
                  {new Date(timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Big Score & Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-4xl font-extrabold text-slate-900 block">
                    {completenessScore}%
                  </span>
                  <span className="text-2xs text-slate-500 font-semibold uppercase tracking-wider">
                    Completeness Score
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {completenessScore >= 80
                      ? 'High Completeness (Ready for Formal Polish)'
                      : completenessScore >= 50
                      ? 'Moderate Completeness (Substantive Revisions Required)'
                      : 'Critical Deficiencies (Action Required)'}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md">
                    {deterministicSummary.formulaExplanation}
                  </p>
                </div>
              </div>

              {/* Reviewer Decisions Count */}
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 text-xs space-y-1">
                <span className="font-semibold text-slate-700 block">Reviewer Decisions:</span>
                <div className="flex items-center space-x-2 text-slate-600">
                  <span className="text-emerald-700 font-bold">{userReviewDecisionsCount.confirmed}</span> Confirmed
                  <span>•</span>
                  <span className="text-sky-700 font-bold">{userReviewDecisionsCount.corrected}</span> Corrected
                  <span>•</span>
                  <span className="text-rose-700 font-bold">{userReviewDecisionsCount.rejected}</span> Rejected
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block">Fully Supported</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">
                {mandatoryRequirementStats.supported}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-slate-500 block">Weak Evidence</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">
                {mandatoryRequirementStats.weak}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-slate-500 block">Ambiguous</span>
              <span className="text-xl font-bold text-indigo-700 mt-1 block">
                {mandatoryRequirementStats.ambiguous}
              </span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-slate-500 block">Missing Items</span>
              <span className="text-xl font-bold text-rose-700 mt-1 block">
                {mandatoryRequirementStats.missing}
              </span>
            </div>
          </div>

          {/* Critical Missing or Weak Items */}
          {(missingRequirements.length > 0 || weakAmbiguousRequirements.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Items Requiring Immediate Applicant Action</span>
              </h3>
              <div className="space-y-2">
                {missingRequirements.map(({ requirement, mapping }) => (
                  <div
                    key={requirement.id}
                    className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-rose-900">
                      <span>[{requirement.id}] {requirement.title}</span>
                      <span className="text-2xs bg-rose-100 px-2 py-0.5 rounded border border-rose-200 uppercase">
                        Missing
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{requirement.description}</p>
                  </div>
                ))}

                {weakAmbiguousRequirements.map(({ requirement, mapping }) => (
                  <div
                    key={requirement.id}
                    className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-amber-900">
                      <span>[{requirement.id}] {requirement.title}</span>
                      <span className="text-2xs bg-amber-100 px-2 py-0.5 rounded border border-amber-200 uppercase">
                        {mapping.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{mapping.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unsupported Claims Summary */}
          {unsupportedClaims.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Unsupported Claims Flagged ({unsupportedClaims.length})</span>
              </h3>
              <div className="space-y-2">
                {unsupportedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="font-semibold text-slate-800 italic">"{claim.claim}"</div>
                    <div className="text-slate-600 text-2xs mt-1">
                      <span className="font-medium">Concern:</span> {claim.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Supporting Documents */}
          {missingSupportingDocuments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                Supporting Documents Status ({missingSupportingDocuments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {missingSupportingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800">{doc.documentName}</span>
                    <span
                      className={`text-2xs font-semibold px-2 py-0.5 rounded uppercase ${
                        doc.status === 'provided'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'not_applicable'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prominent Legal / Funding Disclaimer */}
          <div className="mt-8 p-4 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">
              NON-LEGAL ADVISORY DISCLAIMER:
            </span>
            {disclaimer}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
