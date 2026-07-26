import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = 'Failed to load data', message = 'An error occurred while fetching information.', onRetry }) => {
  return (
    <div className="py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-rose-600 max-w-sm mx-auto mt-1 font-medium">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
