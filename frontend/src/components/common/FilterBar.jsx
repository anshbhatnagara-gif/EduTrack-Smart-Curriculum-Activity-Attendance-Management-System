import React from 'react';
import { Filter } from 'lucide-react';

const FilterBar = ({ filters = [], onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Filter className="w-3.5 h-3.5" />
        <span>Filter:</span>
      </div>

      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="py-1.5 pl-2.5 pr-8 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700"
        >
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
};

export default FilterBar;
