import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherDashboardApi } from '../../api/report.api';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  PlusCircle,
  FileCheck
} from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherDashboardApi();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load teacher dashboard.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher Dashboard" description="Overview of assigned classes, daily schedule, and pending tasks" />
        <LoadingTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher Dashboard" description="Overview of assigned classes, daily schedule, and pending tasks" />
        <ErrorState message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const assignedClasses = data?.assignedClasses || [];
  const todayTimetable = data?.todayTimetable || [];
  const recentAssignments = data?.recentAssignments || [];
  const lowAttendanceStudents = data?.lowAttendanceStudents || [];
  const recentAnnouncements = data?.recentAnnouncements || [];
  const pendingEvaluations = data?.pendingEvaluationsCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        description="Daily teaching overview, class assignments, schedule, and evaluation tasks"
        actions={
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/teacher/attendance/mark')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-primary-600 text-white font-semibold text-xs hover:bg-primary-700 shadow-sm transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Classes</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{assignedClasses.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Lectures</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{todayTimetable.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Assignments</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{recentAssignments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Evaluations</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingEvaluations}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <span>Today's Schedule</span>
          </h3>
          <div className="flex-1 space-y-3">
            {todayTimetable.length > 0 ? (
              todayTimetable.map((slot, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{slot.subject_name}</h4>
                    <p className="text-xs text-slate-500">{slot.class_name} - {slot.section_name} | Room: {slot.room_number || 'N/A'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-bold font-mono">
                    {slot.start_time} - {slot.end_time}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No lectures scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Assigned Classes Quick Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Assigned Classes</span>
            </h3>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {assignedClasses.length > 0 ? (
              assignedClasses.slice(0, 4).map((cls, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cls.class_name} - {cls.section_name}</h4>
                    <p className="text-xs text-slate-500">{cls.subject_name} ({cls.subject_code})</p>
                  </div>
                  <button
                    onClick={() => navigate(`/teacher/attendance/mark?classId=${cls.class_id}&sectionId=${cls.section_id}&subjectId=${cls.subject_id}`)}
                    className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 shadow-sm"
                  >
                    Attendance
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No classes assigned yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Attendance Alerts & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Attendance Warnings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Low Attendance Students (&lt;75%)</span>
          </h3>
          <div className="flex-1 overflow-x-auto">
            {lowAttendanceStudents.length > 0 ? (
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Admission No</th>
                    <th className="px-3 py-2">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowAttendanceStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{s.full_name}</td>
                      <td className="px-3 py-2.5 text-slate-500">{s.admission_number}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-700">
                          {s.attendance_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No low-attendance warnings detected.</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-primary-600" />
              <span>Announcements</span>
            </h3>
            <button
              onClick={() => navigate('/teacher/announcements')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Announcement</span>
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {recentAnnouncements.length > 0 ? (
              recentAnnouncements.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                    <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No announcements posted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
