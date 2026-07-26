import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">404 Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
