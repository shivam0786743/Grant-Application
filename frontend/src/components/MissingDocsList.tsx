import React from 'react';
import { IMissingDocument, DocumentReviewStatus } from '../types';
import { FolderX, CheckCircle, XCircle, Slash, FileText } from 'lucide-react';

interface MissingDocsListProps {
  documents: IMissingDocument[];
  onUpdateStatus: (documentId: string, status: DocumentReviewStatus) => Promise<void>;
}

export const MissingDocsList: React.FC<MissingDocsListProps> = ({
  documents,
  onUpdateStatus
}) => {
  const getStatusBadge = (status: DocumentReviewStatus) => {
    switch (status) {
      case 'missing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Missing
          </span>
        );
      case 'provided':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Provided
          </span>
        );
      case 'not_applicable':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Slash className="w-3 h-3 mr-1" />
            Not Applicable
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderX className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            Required Supporting Documents ({documents.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Mark items as Provided, Missing, or Not Applicable
        </span>
      </div>

      <div className="p-4">
        {documents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No missing supporting documents identified for this proposal.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900">{doc.documentName}</span>
                    {doc.requirementId && (
                      <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {doc.requirementId}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">{doc.reason}</p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                  {getStatusBadge(doc.status)}

                  <select
                    value={doc.status}
                    onChange={(e) =>
                      onUpdateStatus(doc.id, e.target.value as DocumentReviewStatus)
                    }
                    className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="missing">Mark as Missing</option>
                    <option value="provided">Mark as Provided</option>
                    <option value="not_applicable">Mark as Not Applicable</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
