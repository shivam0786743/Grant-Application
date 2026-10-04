import React from 'react';
import { IUnsupportedClaim, ClaimSeverity } from '../types';
import { AlertOctagon, AlertTriangle, ShieldAlert } from 'lucide-react';

interface UnsupportedClaimsListProps {
  claims: IUnsupportedClaim[];
}

export const UnsupportedClaimsList: React.FC<UnsupportedClaimsListProps> = ({ claims }) => {
  const getSeverityBadge = (severity: ClaimSeverity) => {
    switch (severity) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            Medium Risk
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            Low Risk
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-slate-900">
            Detected Unsupported Claims ({claims.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Bold or quantitative statements lacking substantiating evidence
        </span>
      </div>

      <div className="p-4">
        {claims.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No unsupported claims were detected in the application draft.
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-3.5 bg-rose-50/30 border border-rose-200 rounded-lg space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-mono text-2xs text-rose-800 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 inline-block self-start">
                    {claim.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-mono text-2xs">
                      Location: {claim.location}
                    </span>
                    {getSeverityBadge(claim.severity)}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-rose-100 text-slate-900 font-medium italic">
                  "{claim.claim}"
                </div>

                <div className="text-slate-700 pl-1">
                  <span className="font-semibold text-rose-900">Reason for Concern: </span>
                  {claim.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
