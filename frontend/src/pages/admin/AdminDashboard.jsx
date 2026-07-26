import React from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { ShieldCheck, Info } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div>
      <PageHeader
        title="Admin Portal Dashboard"
        description="System administration and school overview portal"
      />

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Portal Initialized</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Phase F1 foundation setup complete. Authentication, token injection, session restoration, and role guards are verified.
        </p>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left max-w-md mx-auto flex items-start space-x-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">Phase F1 Status:</span>
            Full live API dashboard stats and management cards will be connected in Phase F2.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
