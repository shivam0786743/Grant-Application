import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface StaleWarningBannerProps {
  staleReason?: string;
  onReanalyze?: () => void;
}

export const StaleWarningBanner: React.FC<StaleWarningBannerProps> = ({
  staleReason,
  onReanalyze
}) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-md shadow-xs">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between md:items-center">
          <div>
            <h3 className="text-sm font-semibold text-amber-800">
              STALE ASSESSMENT WARNING
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              {staleReason ||
                'Underlying guideline or draft application documents have been updated since this assessment was conducted. Completeness scores and evidence citations may be out of date.'}
            </p>
          </div>
          {onReanalyze && (
            <div className="mt-3 md:mt-0 md:ml-6 flex-shrink-0">
              <button
                type="button"
                onClick={onReanalyze}
                className="inline-flex items-center px-3 py-1.5 border border-amber-400 text-xs font-semibold rounded text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Update & Re-Assess
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
