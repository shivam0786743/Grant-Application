import React, { useState, useMemo } from 'react';
import { IRequirement } from '../types';
import { Search, Tag, BookOpen, CheckCircle, HelpCircle } from 'lucide-react';

interface RequirementsListProps {
  requirements: IRequirement[];
}

export const RequirementsList: React.FC<RequirementsListProps> = ({ requirements }) => {
  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'recommendation'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    requirements.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (filterType === 'mandatory' && !r.mandatory) return false;
      if (filterType === 'recommendation' && r.mandatory) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.sourceCitation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requirements, filterType, categoryFilter, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Guideline Requirements</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {filteredRequirements.length} of {requirements.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Structured criteria extracted by AI from the grant guidelines
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Mandatory / Recommendation toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'all' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('mandatory')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'mandatory' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mandatory
            </button>
            <button
              onClick={() => setFilterType('recommendation')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'recommendation' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recommendations
            </button>
          </div>

          {/* Category Select */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg py-1.5 px-2 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Requirements Table */}
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {filteredRequirements.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No requirements match the current filters.
          </div>
        ) : (
          filteredRequirements.map((req) => (
            <div key={req.id} className="p-4 hover:bg-slate-50/80 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {req.id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{req.title}</h3>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Category */}
                  <span className="inline-flex items-center text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    <Tag className="w-3 h-3 mr-1" />
                    {req.category}
                  </span>

                  {/* Mandatory vs Recommendation */}
                  {req.mandatory ? (
                    <span className="inline-flex items-center text-2xs px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                      Mandatory
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-2xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Recommendation
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-3">{req.description}</p>

              {/* Source Citation & snippet */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 space-y-1">
                <div className="flex items-center text-slate-800 font-medium space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>Guideline Citation:</span>
                  <span className="font-mono text-slate-700">{req.sourceCitation}</span>
                </div>
                {req.sourceText && (
                  <p className="italic text-slate-600 pl-5 border-l-2 border-slate-300">
                    "{req.sourceText}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
