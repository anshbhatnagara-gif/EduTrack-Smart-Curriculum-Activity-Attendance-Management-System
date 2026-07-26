import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading EduTrack...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
          E
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">EduTrack</span>
      </div>
      <div className="flex items-center space-x-2 text-slate-600 font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
