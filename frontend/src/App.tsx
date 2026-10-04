import React, { useState } from 'react';
import { IAssessment } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'upload' | 'dashboard' | 'history'>('upload');
  const [activeAssessment, setActiveAssessment] = useState<IAssessment | null>(null);

  const handleAssessmentCreated = (assessment: IAssessment) => {
    setActiveAssessment(assessment);
    setCurrentTab('dashboard');
  };

  const handleSelectFromHistory = async (assessmentId: string) => {
    try {
      const assessment = await api.getAssessment(assessmentId);
      setActiveAssessment(assessment);
      setCurrentTab('dashboard');
    } catch (err: any) {
      alert('Failed to load selected assessment: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasActiveAssessment={activeAssessment !== null}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'upload' && (
          <UploadPage onAssessmentCreated={handleAssessmentCreated} />
        )}

        {currentTab === 'dashboard' && activeAssessment && (
          <DashboardPage
            assessment={activeAssessment}
            onUpdateAssessment={setActiveAssessment}
            onNavigateToUpload={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryPage
            onSelectAssessment={handleSelectFromHistory}
            onNavigateToUpload={() => setCurrentTab('upload')}
          />
        )}
      </main>

      {/* Sticky / Permanent Advisory Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-700">Pre-Submission Advisory Tool:</span>
            <span>
              This software provides evidence-based draft completeness analysis. It does NOT constitute a legal, formal, or authoritative funding-eligibility decision.
            </span>
          </div>
          <div className="text-slate-400 font-mono text-2xs">
            v1.0.0 • Deterministic Scoring Engine
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
