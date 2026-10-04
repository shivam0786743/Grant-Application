import React, { useState } from 'react';
import { api } from '../services/api';
import { IAssessment } from '../types';
import { SampleDataSelector } from '../components/SampleDataSelector';
import {
  Upload,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

interface UploadPageProps {
  onAssessmentCreated: (assessment: IAssessment) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onAssessmentCreated }) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'text'>('upload');

  // File states
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [applicationFile, setApplicationFile] = useState<File | null>(null);

  // Text states
  const [guidelineText, setGuidelineText] = useState('');
  const [applicationText, setApplicationText] = useState('');
  const [title, setTitle] = useState('Grant Application Completeness Review');

  // Supporting docs metadata
  const [supportingDocs, setSupportingDocs] = useState<Array<{ name: string; notes: string }>>([
    { name: 'IRS 501(c)(3) Tax Exemption Letter', notes: 'Mandatory documentation for eligibility' }
  ]);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddSupportingDoc = () => {
    setSupportingDocs([...supportingDocs, { name: '', notes: '' }]);
  };

  const handleRemoveSupportingDoc = (index: number) => {
    setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
  };

  const handleLoadSample = (gText: string, aText: string, sampleTitle: string) => {
    setActiveInputMode('text');
    setGuidelineText(gText);
    setApplicationText(aText);
    setTitle(sampleTitle);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate
    if (activeInputMode === 'upload') {
      if (!guidelineFile) {
        setErrorMessage('Please upload a grant guideline document (PDF, DOCX, or TXT).');
        return;
      }
      if (!applicationFile) {
        setErrorMessage('Please upload a draft application document (PDF, DOCX, or TXT).');
        return;
      }
    } else {
      if (!guidelineText.trim()) {
        setErrorMessage('Please provide grant guideline text.');
        return;
      }
      if (!applicationText.trim()) {
        setErrorMessage('Please provide draft application text.');
        return;
      }
    }

    try {
      setIsLoading(true);
      setLoadingStep('Uploading documents & extracting text...');

      const validDocs = supportingDocs.filter((d) => d.name.trim().length > 0);

      let assessment: IAssessment;

      if (activeInputMode === 'upload' && guidelineFile && applicationFile) {
        const formData = new FormData();
        formData.append('guidelineFile', guidelineFile);
        formData.append('applicationFile', applicationFile);
        formData.append('title', title);
        if (validDocs.length > 0) {
          formData.append('supportingDocsMetadata', JSON.stringify(validDocs));
        }

        setTimeout(() => setLoadingStep('Extracting structured guideline requirements with AI...'), 1200);
        setTimeout(() => setLoadingStep('Mapping application text against requirements...'), 2400);
        setTimeout(() => setLoadingStep('Detecting unsupported claims & missing items...'), 3600);
        setTimeout(() => setLoadingStep('Calculating deterministic completeness score...'), 4800);

        assessment = await api.createAssessment(formData);
      } else {
        setTimeout(() => setLoadingStep('Extracting structured guideline requirements with AI...'), 1000);
        setTimeout(() => setLoadingStep('Mapping application text against requirements...'), 2000);
        setTimeout(() => setLoadingStep('Detecting unsupported claims & missing items...'), 3000);
        setTimeout(() => setLoadingStep('Calculating deterministic completeness score...'), 4000);

        assessment = await api.createAssessmentFromText({
          guidelineFilename: 'guideline_document.txt',
          guidelineText,
          applicationFilename: 'application_draft.txt',
          applicationText,
          supportingDocsMetadata: validDocs,
          title
        });
      }

      onAssessmentCreated(assessment);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'An error occurred during assessment. Please verify your documents and try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create Grant Completeness Assessment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload funding guidelines and your draft proposal to perform an evidence-based compliance audit.
        </p>
      </div>

      {/* Quick Sample Selector */}
      <SampleDataSelector onLoadSample={handleLoadSample} />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error Creating Assessment</span>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Upload / Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Assessment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. NSF STEM Community Grant 2025 Review"
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
          <span className="text-xs font-semibold text-slate-600">Input Mode:</span>
          <button
            type="button"
            onClick={() => setActiveInputMode('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeInputMode === 'upload'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            File Upload (.pdf, .docx, .txt)
          </button>
          <button
            type="button"
            onClick={() => setActiveInputMode('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeInputMode === 'text'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Direct Text Input / Paste
          </button>
        </div>

        {activeInputMode === 'upload' ? (
          /* File Upload Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guideline Document */}
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
              <div className="p-3 bg-sky-100 text-sky-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Funding Guideline Document
              </h3>
              <p className="text-2xs text-slate-500 mt-1 mb-3">
                RFP, Notice of Funding Opportunity (NOFO), or Guideline (PDF, DOCX, TXT)
              </p>
              <input
                type="file"
                id="guideline-upload"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setGuidelineFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="guideline-upload"
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {guidelineFile ? 'Change File' : 'Select Guideline Document'}
              </label>
              {guidelineFile && (
                <div className="mt-2 text-2xs font-semibold text-sky-700 flex items-center justify-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{guidelineFile.name}</span>
                </div>
              )}
            </div>

            {/* Application Document */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Draft Application Document
              </h3>
              <p className="text-2xs text-slate-500 mt-1 mb-3">
                Your draft proposal narrative, budget description, or full draft (PDF, DOCX, TXT)
              </p>
              <input
                type="file"
                id="app-upload"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setApplicationFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="app-upload"
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {applicationFile ? 'Change File' : 'Select Application Document'}
              </label>
              {applicationFile && (
                <div className="mt-2 text-2xs font-semibold text-emerald-700 flex items-center justify-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{applicationFile.name}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Direct Text Inputs */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Funding Guideline Text
              </label>
              <textarea
                rows={10}
                value={guidelineText}
                onChange={(e) => setGuidelineText(e.target.value)}
                placeholder="Paste the grant instructions, mandatory requirements, and eligibility guidelines here..."
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Draft Application Text
              </label>
              <textarea
                rows={10}
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
                placeholder="Paste your draft application proposal narrative here..."
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>
          </div>
        )}

        {/* Optional Supporting Document Metadata */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Optional Supporting Documents Metadata
              </h3>
              <p className="text-2xs text-slate-500">
                Specify any expected attachments or certificates you plan to cross-reference
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSupportingDoc}
              className="inline-flex items-center text-xs font-medium text-sky-600 hover:text-sky-800"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Document
            </button>
          </div>

          <div className="space-y-2">
            {supportingDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Document Name (e.g. 501(c)(3) Letter)"
                  value={doc.name}
                  onChange={(e) => {
                    const copy = [...supportingDocs];
                    copy[idx].name = e.target.value;
                    setSupportingDocs(copy);
                  }}
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="text"
                  placeholder="Optional Notes..."
                  value={doc.notes}
                  onChange={(e) => {
                    const copy = [...supportingDocs];
                    copy[idx].notes = e.target.value;
                    setSupportingDocs(copy);
                  }}
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSupportingDoc(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button & Progress State */}
        <div className="pt-4 border-t border-slate-200 flex flex-col items-center">
          {isLoading ? (
            <div className="text-center py-4 space-y-2">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-800">{loadingStep}</p>
              <p className="text-2xs text-slate-400">
                Grounding analysis strictly against provided documents...
              </p>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Start Completeness Analysis</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
