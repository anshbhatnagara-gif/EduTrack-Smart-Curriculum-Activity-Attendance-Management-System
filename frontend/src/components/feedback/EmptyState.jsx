import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ title = 'No records found', description = 'There are no items matching your criteria.', action }) => {
  return (
    <div className="py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <FolderOpen className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
