import React, { useState } from 'react';
import { IDeterministicSummary } from '../types';
import { Info, CheckCircle2, AlertTriangle, HelpCircle, XCircle, HelpCircleIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface CompletenessGaugeProps {
  summary?: IDeterministicSummary;
}

export const CompletenessGauge: React.FC<CompletenessGaugeProps> = ({ summary }) => {
  const [showFormula, setShowFormula] = useState(false);

  if (!summary) {
    return null;
  }

  const {
    completenessScore,
    totalMandatory,
    supported,
    weak,
    ambiguous,
    missing,
    unsupported,
    totalRecommendations,
    recommendationsSupported,
    recommendationScore,
    formulaExplanation
  } = summary;

  // Determine badge & color
  let scoreColorClass = 'text-red-600 bg-red-50 border-red-200';
  let barColorClass = 'bg-red-500';
  let scoreGrade = 'Substantially Incomplete';

  if (completenessScore >= 80) {
    scoreColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    barColorClass = 'bg-emerald-500';
    scoreGrade = 'High Completeness';
  } else if (completenessScore >= 50) {
    scoreColorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    barColorClass = 'bg-amber-500';
    scoreGrade = 'Moderate Completeness (Revisions Required)';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Big Score Card */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Mandatory Completeness
          </span>
          <div className="flex items-baseline space-x-1 my-1">
            <span className="text-5xl font-extrabold tracking-tight text-slate-900">
              {completenessScore}
            </span>
            <span className="text-2xl font-bold text-slate-500">%</span>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${scoreColorClass} mt-2`}
          >
            {scoreGrade}
          </span>
          <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColorClass}`}
              style={{ width: `${Math.min(100, Math.max(0, completenessScore))}%` }}
            ></div>
          </div>
          <span className="text-2xs text-slate-400 mt-2">
            Calculated deterministically in backend code
          </span>
        </div>

        {/* Detailed Statistics */}
        <div className="lg:col-span-8 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Mandatory Requirements ({totalMandatory} total)
              </h3>
              <span className="text-xs text-slate-500">
                {supported} of {totalMandatory} fully satisfied
              </span>
            </div>

            {/* Metric pill cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-2">
              {/* Supported */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                <div className="flex items-center space-x-1 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Supported</span>
                </div>
                <span className="text-xl font-bold text-emerald-800 mt-1">{supported}</span>
                <span className="text-2xs text-emerald-600">1.0 pt each</span>
              </div>

              {/* Weak */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 flex flex-col items-center">
                <div className="flex items-center space-x-1 text-amber-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Weak</span>
                </div>
                <span className="text-xl font-bold text-amber-800 mt-1">{weak}</span>
                <span className="text-2xs text-amber-600">0.4 pt each</span>
              </div>

              {/* Ambiguous */}
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center">
                <div className="flex items-center space-x-1 text-indigo-700 text-xs font-medium">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Ambiguous</span>
                </div>
                <span className="text-xl font-bold text-indigo-800 mt-1">{ambiguous}</span>
                <span className="text-2xs text-indigo-600">0.2 pt each</span>
              </div>

              {/* Missing */}
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 flex flex-col items-center">
                <div className="flex items-center space-x-1 text-rose-700 text-xs font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missing</span>
                </div>
                <span className="text-xl font-bold text-rose-800 mt-1">{missing}</span>
                <span className="text-2xs text-rose-600">0.0 pt</span>
              </div>

              {/* Unsupported Claims */}
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex flex-col items-center col-span-2 sm:col-span-1">
                <div className="flex items-center space-x-1 text-red-700 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Unsupported</span>
                </div>
                <span className="text-xl font-bold text-red-800 mt-1">{unsupported}</span>
                <span className="text-2xs text-red-600">0.0 pt</span>
              </div>
            </div>
          </div>

          {/* Recommendations Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Optional Recommendations:</span>
              <span className="text-slate-600">
                {recommendationsSupported} of {totalRecommendations} supported ({recommendationScore}%)
              </span>
            </div>
            <span className="text-slate-400 italic">
              Excluded from mandatory score calculation
            </span>
          </div>

          {/* Collapsible Formula Explanation */}
          <div>
            <button
              type="button"
              onClick={() => setShowFormula(!showFormula)}
              className="inline-flex items-center text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
            >
              <Info className="w-3.5 h-3.5 mr-1" />
              <span>{showFormula ? 'Hide Scoring Formula' : 'View Scoring Formula & Weighting'}</span>
              {showFormula ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>
            {showFormula && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1 font-mono">
                <p className="font-semibold text-slate-900 font-sans">Deterministic Formula Breakdown:</p>
                <p>{formulaExplanation}</p>
                <p className="text-slate-500 font-sans mt-1">
                  User review decisions (Confirm / Correct / Reject) dynamically update the effective status and trigger real-time score recomputation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
