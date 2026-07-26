import React from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({ value, onChange, onClear, placeholder = 'Search...' }) => {
  return (
    <div className="relative rounded-lg shadow-sm w-full sm:w-72">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
