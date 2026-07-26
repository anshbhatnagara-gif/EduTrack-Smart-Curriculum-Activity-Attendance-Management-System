import React from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import { User, Mail, Phone, Shield, Calendar, Award } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="User Profile"
        description="View your personal account settings and role details"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800 p-6 flex items-end">
          <div className="flex items-center space-x-4 transform translate-y-8">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full rounded-xl bg-primary-600 text-white font-bold text-3xl flex items-center justify-center">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="text-white pb-2">
              <h2 className="text-xl font-bold">{user?.full_name}</h2>
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-white inline-block">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="pt-12 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <User className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.full_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Phone className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 mt-0.5">
                {user?.status || 'active'}
              </span>
            </div>
          </div>

          {user?.teacherInfo && (
            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 col-span-1 md:col-span-2">
              <Award className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Profile Info</p>
                <p className="text-sm text-slate-700 mt-1">Employee Code: <span className="font-semibold">{user.teacherInfo.employee_code}</span></p>
                <p className="text-sm text-slate-700">Qualification: <span className="font-semibold">{user.teacherInfo.qualification}</span></p>
              </div>
            </div>
          )}

          {user?.studentInfo && (
            <div className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100 col-span-1 md:col-span-2">
              <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Profile Info</p>
                <p className="text-sm text-slate-700 mt-1">Admission Number: <span className="font-semibold">{user.studentInfo.admission_number}</span></p>
                <p className="text-sm text-slate-700">Roll Number: <span className="font-semibold">{user.studentInfo.roll_number}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
