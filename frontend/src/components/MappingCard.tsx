import React, { useState } from 'react';
import { IRequirement, IApplicationMapping, ReviewAction, MappingStatus } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  FileSearch,
  Check,
  Edit3,
  X,
  FileCheck,
  ChevronDown,
  MessageSquare,
  FileText
} from 'lucide-react';

interface MappingCardProps {
  requirement: IRequirement;
  mapping: IApplicationMapping;
  onReviewDecision: (
    requirementId: string,
    decision: {
      action: ReviewAction;
      correctedStatus?: MappingStatus;
      notes?: string;
      reviewedBy?: string;
    }
  ) => Promise<void>;
}

export const MappingCard: React.FC<MappingCardProps> = ({
  requirement,
  mapping,
  onReviewDecision
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MappingStatus>(
    mapping.userDecision?.correctedStatus || mapping.status
  );
  const [reviewerNotes, setReviewerNotes] = useState(mapping.userDecision?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status badge styles
  const getStatusBadge = (status: MappingStatus) => {
    switch (status) {
      case 'supported':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Supported',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'weak':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          label: 'Weak Evidence',
          classes: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'ambiguous':
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Ambiguous',
          classes: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      case 'missing':
        return {
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Missing Evidence',
          classes: 'bg-rose-100 text-rose-800 border-rose-300'
        };
      case 'unsupported':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          label: 'Unsupported Claim',
          classes: 'bg-red-100 text-red-800 border-red-300'
        };
    }
  };

  const currentBadge = getStatusBadge(mapping.status);
  const effectiveStatus = mapping.userDecision?.correctedStatus || (
    mapping.userDecision?.action === 'reject' ? 'missing' : mapping.status
  );
  const effectiveBadge = getStatusBadge(effectiveStatus);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onReviewDecision(requirement.id, {
        action: 'confirm',
        notes: 'Confirmed by reviewer'
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onReviewDecision(requirement.id, {
        action: 'correct',
        correctedStatus: selectedStatus,
        notes: reviewerNotes
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await onReviewDecision(requirement.id, {
        action: 'reject',
        notes: reviewerNotes || 'Rejected by reviewer'
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
        mapping.userDecision
          ? 'border-sky-300 ring-1 ring-sky-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {requirement.id}
            </span>
            <h3 className="text-sm font-bold text-slate-900">{requirement.title}</h3>
          </div>
          <p className="text-xs text-slate-500">{requirement.description}</p>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${effectiveBadge.classes}`}
            >
              {effectiveBadge.icon}
              {effectiveBadge.label}
            </span>

            {requirement.mandatory ? (
              <span className="text-2xs font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                Mandatory
              </span>
            ) : (
              <span className="text-2xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                Recommendation
              </span>
            )}
          </div>

          {mapping.userDecision && (
            <span className="text-2xs text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Reviewer {mapping.userDecision.action.toUpperCase()}
              {mapping.userDecision.action === 'correct' && ` -> ${mapping.userDecision.correctedStatus}`}
            </span>
          )}
        </div>
      </div>

      {/* Evidence & Explanation Box */}
      <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
        {/* Cited Evidence */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
            <span className="flex items-center space-x-1.5">
              <FileSearch className="w-3.5 h-3.5 text-sky-600" />
              <span>Application Evidence</span>
            </span>
            <span className="font-mono text-2xs text-slate-500">
              Citation: {mapping.evidenceCitation || 'Not cited'}
            </span>
          </div>
          <p className="text-slate-800 leading-relaxed italic">
            "{mapping.evidence || 'No direct evidence identified in the draft.'}"
          </p>
        </div>

        {/* AI Explanation & Confidence */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600 px-1">
          <p className="flex-1">
            <span className="font-semibold text-slate-700">Analysis: </span>
            {mapping.explanation}
          </p>
          <div className="flex items-center space-x-2 text-2xs flex-shrink-0">
            <span className="text-slate-400">AI Confidence:</span>
            <div className="w-16 bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-sky-600 h-1.5 rounded-full"
                style={{ width: `${Math.round(mapping.confidence * 100)}%` }}
              ></div>
            </div>
            <span className="font-mono font-medium">{Math.round(mapping.confidence * 100)}%</span>
          </div>
        </div>

        {/* Clarification Questions (if weak/ambiguous/missing) */}
        {mapping.clarificationQuestions && mapping.clarificationQuestions.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3">
            <div className="flex items-center space-x-1.5 text-amber-800 font-semibold mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommended Clarification Questions:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-900 pl-1">
              {mapping.clarificationQuestions.map((q, idx) => (
                <li key={idx} className="leading-snug">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Supporting Documents Needed */}
        {mapping.supportingDocumentsNeeded && mapping.supportingDocumentsNeeded.length > 0 && (
          <div className="flex items-center space-x-2 text-slate-600">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Supporting Docs Needed:</span>
            <span className="font-mono text-slate-600">
              {mapping.supportingDocumentsNeeded.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Review Actions Panel */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {/* Previous notes indicator if present */}
        {mapping.userDecision?.notes && !isEditing && (
          <p className="text-2xs text-slate-500 italic">
            Reviewer Note: "{mapping.userDecision.notes}"
          </p>
        )}

        <div className="flex items-center space-x-2 ml-auto">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                title="Confirm this evaluation as correct"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Confirm
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs"
                title="Manually correct this evaluation status"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Correct
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
                title="Reject AI evaluation (treat as missing)"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reject
              </button>
            </>
          ) : (
            /* Inline Correction Form */
            <form onSubmit={handleCorrectSubmit} className="w-full flex flex-col sm:flex-row items-center gap-2 mt-2">
              <div className="flex-1 w-full sm:w-auto">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as MappingStatus)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                >
                  <option value="supported">Supported (1.0 pt)</option>
                  <option value="weak">Weak Evidence (0.4 pt)</option>
                  <option value="ambiguous">Ambiguous (0.2 pt)</option>
                  <option value="missing">Missing (0.0 pt)</option>
                  <option value="unsupported">Unsupported Claim (0.0 pt)</option>
                </select>
              </div>

              <div className="flex-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Reviewer justification note..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 self-end sm:self-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
