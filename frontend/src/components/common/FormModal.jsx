import React from 'react';
import { X } from 'lucide-react';

const FormModal = ({ isOpen, title, onClose, children, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full ${maxWidth} p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 leading-none">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close form modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
