import React from 'react';
import { FileCheck, PlusCircle, History, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentTab: 'upload' | 'dashboard' | 'history';
  onSelectTab: (tab: 'upload' | 'dashboard' | 'history') => void;
  hasActiveAssessment: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasActiveAssessment
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 text-white p-2 rounded-lg shadow-sm">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Grant Application Completeness Assistant
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                  AI Review
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Evidence-based completeness review against funding guidelines
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onSelectTab('upload')}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'upload'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Assessment
            </button>

            {hasActiveAssessment && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="w-4 h-4 mr-1.5" />
                Active Review
              </button>
            )}

            <button
              onClick={() => onSelectTab('history')}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'history'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4 mr-1.5" />
              History
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
