import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white font-extrabold text-2xl shadow-lg shadow-primary-500/30 mb-3">
          E
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          EduTrack
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Smart School Curriculum, Attendance & Academic System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
