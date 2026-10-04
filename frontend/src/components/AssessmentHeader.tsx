import React from 'react';
import { IAssessment } from '../types';
import { FileText, FileSpreadsheet, Calendar, Award, RefreshCw, Printer } from 'lucide-react';

interface AssessmentHeaderProps {
  assessment: IAssessment;
  onOpenSummary: () => void;
  onRecalculate: () => void;
  isRecalculating?: boolean;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  assessment,
  onOpenSummary,
  onRecalculate,
  isRecalculating
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {assessment.title || 'Grant Application Completeness Assessment'}
            </h1>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              {assessment.assessmentId}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
            {/* Guideline */}
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Guideline:</span>
              <span className="font-semibold text-slate-800">{assessment.guidelineFilename}</span>
              <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-mono font-medium">
                v{assessment.guidelineVersion}
              </span>
            </div>

            {/* Application */}
            <div className="flex items-center space-x-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Application Draft:</span>
              <span className="font-semibold text-slate-800">{assessment.applicationFilename}</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono font-medium">
                v{assessment.applicationVersion}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(assessment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start lg:self-center">
          <button
            type="button"
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-hidden disabled:opacity-50 transition-colors shadow-2xs"
            title="Recalculate deterministic score based on current review overrides"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </button>

          <button
            type="button"
            onClick={onOpenSummary}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-hidden shadow-xs transition-colors"
          >
            <Award className="w-4 h-4 mr-1.5" />
            Reviewed Summary Report
          </button>
        </div>
      </div>
    </div>
  );
};
