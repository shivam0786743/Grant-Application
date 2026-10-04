import React, { useEffect, useState } from 'react';
import { IAssessment } from '../types';
import { api } from '../services/api';
import { History, FileCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

interface HistoryPageProps {
  onSelectAssessment: (assessmentId: string) => void;
  onNavigateToUpload: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectAssessment,
  onNavigateToUpload
}) => {
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.listAssessments();
      setAssessments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assessment history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assessment History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review previous grant evaluations, scores, and versioned audits.
          </p>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          New Assessment
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading assessment history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          {error}
        </div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Assessments Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't run any grant completeness assessments yet. Upload a guideline and proposal to start your first evaluation.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Create Your First Assessment
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {assessments.map((asm) => (
            <div
              key={asm.assessmentId}
              onClick={() => onSelectAssessment(asm.assessmentId)}
              className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{asm.title}</h3>
                  <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    {asm.assessmentId}
                  </span>
                  {asm.stale && (
                    <span className="inline-flex items-center text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Stale
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 flex items-center space-x-3">
                  <span>Guideline: {asm.guidelineFilename}</span>
                  <span>•</span>
                  <span>Application: {asm.applicationFilename}</span>
                  <span>•</span>
                  <span>{new Date(asm.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">
                    {asm.deterministicSummary?.completenessScore ?? 0}%
                  </div>
                  <div className="text-2xs text-slate-400">Score</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
