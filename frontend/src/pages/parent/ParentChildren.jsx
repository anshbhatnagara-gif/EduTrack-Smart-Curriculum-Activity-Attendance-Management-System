import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyChildrenApi } from '../../api/user.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Users, CheckSquare, ClipboardCheck, Award, Clock } from 'lucide-react';

const ParentChildren = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyChildrenApi();
      if (res.success) {
        setChildren(res.data || []);
      } else {
        setError(res.message || 'Failed to load linked children.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Children" description="Linked student profiles enrolled under your guardian account" />
        <LoadingTable rows={4} cols={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Children" description="Linked student profiles enrolled under your guardian account" />
        <ErrorState message={error} onRetry={fetchChildren} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Children"
        description="Overview of all student wards linked to your parent account with quick navigation to academic records"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <div key={child.student_id || child.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                {child.full_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{child.full_name}</h3>
                <p className="text-xs text-slate-500">
                  {child.class_name} {child.section_name} | Admission: {child.admission_number || 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Roll Number:</span>
                <span className="font-bold text-slate-900">{child.roll_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Gender:</span>
                <span className="font-bold text-slate-900 capitalize">{child.gender || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/parent/child-attendance')}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => navigate('/parent/child-marks')}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Marks</span>
              </button>

              <button
                onClick={() => navigate('/parent/child-assignments')}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Assignments</span>
              </button>

              <button
                onClick={() => navigate('/parent/child-timetable')}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Timetable</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentChildren;
