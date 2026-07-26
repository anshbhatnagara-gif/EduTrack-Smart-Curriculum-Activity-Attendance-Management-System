import React from 'react';

const LoadingTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex space-x-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-4 bg-slate-200 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingTable;
