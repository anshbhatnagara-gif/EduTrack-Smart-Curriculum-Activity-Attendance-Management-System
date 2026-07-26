import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'teacher':
        navigate('/teacher/dashboard', { replace: true });
        break;
      case 'student':
        navigate('/student/dashboard', { replace: true });
        break;
      case 'parent':
        navigate('/parent/dashboard', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">403 Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to access this page or role resource.
        </p>

        <div className="mt-6">
          <button
            onClick={handleGoHome}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
