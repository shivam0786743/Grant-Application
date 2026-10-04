import React, { useState } from 'react';
import { HelpCircle, Copy, Check } from 'lucide-react';

interface ClarificationQuestionsListProps {
  questions: Array<{
    requirementId: string;
    requirementTitle: string;
    question: string;
  }>;
}

export const ClarificationQuestionsList: React.FC<ClarificationQuestionsListProps> = ({
  questions
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    const text = questions
      .map(
        (q, idx) =>
          `${idx + 1}. [${q.requirementId}] ${q.requirementTitle}:\n   ${q.question}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Actionable Clarification Questions ({questions.length})
          </h2>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Copy All Questions
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        {questions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No clarification questions required. All evaluated items have sufficient grounding.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-2xs font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                    {item.requirementId}
                  </span>
                  <span className="font-semibold text-slate-800">{item.requirementTitle}</span>
                </div>
                <p className="text-indigo-950 pl-1 leading-relaxed">{item.question}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
