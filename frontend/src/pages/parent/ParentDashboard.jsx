import React, { useEffect, useState, useCallback } from 'react';
import { getParentDashboardApi } from '../../api/report.api';
import ChildSelector from '../../components/parent/ChildSelector';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { CheckSquare, Award, ClipboardCheck, AlertTriangle, Megaphone, RefreshCw, Users } from 'lucide-react';

const ParentDashboard = () => {
  const [childrenReports, setChildrenReports] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getParentDashboardApi();
      if (res.success) {
        setChildrenReports(res.data || []);
        if (res.data && res.data.length > 0 && !selectedChildId) {
          setSelectedChildId(res.data[0].studentId);
        }
      } else {
        setError(res.message || 'Failed to load parent dashboard.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Parent Dashboard" description="Linked children performance, attendance alerts, and academic progress" />
        <LoadingTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Parent Dashboard" description="Linked children performance, attendance alerts, and academic progress" />
        <ErrorState message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const currentReport = childrenReports.find((r) => String(r.studentId) === String(selectedChildId)) || childrenReports[0];

  const overallAtt = currentReport?.overallAttendancePercentage ?? 0;
  const recentMarks = currentReport?.recentMarks || [];
  const pendingAssignments = currentReport?.pendingAssignments || [];
  const warnings = currentReport?.warnings || [];
  const announcements = currentReport?.announcements || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Parent Dashboard"
          description="Monitor your linked children's attendance status, exam results, and pending homework assignments"
        />
        <div className="flex items-center space-x-3">
          <ChildSelector
            selectedChildId={selectedChildId}
            onSelectChild={(c) => setSelectedChildId(c.student_id || c.studentId)}
          />
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentReport && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                <h3 className={`text-2xl font-extrabold mt-1 ${overallAtt < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {overallAtt}%
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overallAtt < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <CheckSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Assignments</p>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingAssignments.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exams Graded</p>
                <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{recentMarks.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Children</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{childrenReports.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          {overallAtt < 75 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Attendance Warning:</span> {currentReport.studentName}'s attendance is currently {overallAtt}%, which requires administrative attention.
              </div>
            </div>
          )}

          {/* Grid Layout for Recent Marks & Pending Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Marks */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Recent Exam Marks</span>
              </h3>
              <div className="flex-1 space-y-3">
                {recentMarks.length > 0 ? (
                  recentMarks.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{m.subject_name} ({m.exam_name})</h4>
                        <p className="text-[11px] text-slate-500">Max Marks: {m.maximum_marks}</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-extrabold font-mono">
                        {m.marks_obtained} / {m.maximum_marks} ({m.grade})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center italic">No recent marks recorded.</p>
                )}
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                <span>Pending Homework</span>
              </h3>
              <div className="flex-1 space-y-3">
                {pendingAssignments.length > 0 ? (
                  pendingAssignments.map((a) => (
                    <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                        <p className="text-[11px] text-slate-500">{a.subject_name} | Due: {new Date(a.due_date).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Pending</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center italic">No pending homework assignments.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
