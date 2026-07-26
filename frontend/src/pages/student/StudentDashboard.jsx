import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboardApi } from '../../api/report.api';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import {
  CheckSquare,
  Award,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  Bell
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentDashboardApi();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load student dashboard.');
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
        <PageHeader title="Student Dashboard" description="Personal academic metrics, attendance, and timetable schedule" />
        <LoadingTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Dashboard" description="Personal academic metrics, attendance, and timetable schedule" />
        <ErrorState message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const overallAtt = data?.overallAttendancePercentage ?? 0;
  const subjectAtt = data?.subjectAttendance || [];
  const pendingAssignments = data?.pendingAssignments || [];
  const recentMarks = data?.recentMarks || [];
  const todaySchedule = data?.todaySchedule || [];
  const announcements = data?.announcements || [];
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Overview of your attendance, enrolled class timetable, pending homework, and exam results"
        actions={
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${overallAtt < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overallAtt}%
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overallAtt < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Assignments Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Homework</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingAssignments.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Recent Marks Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exams Recorded</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{recentMarks.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Unread Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unread Alerts</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{notifications.filter(n => !n.is_read).length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Warning Alert if Attendance < 75% */}
      {overallAtt < 75 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Low Attendance Warning:</span> Your current overall attendance is {overallAtt}%, which is below the mandatory 75% threshold.
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <span>Today's Class Schedule</span>
          </h3>
          <div className="flex-1 space-y-3">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((slot, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{slot.subject_name}</h4>
                    <p className="text-xs text-slate-500">Teacher: {slot.teacher_name} | Room: {slot.room_number || 'N/A'}</p>
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

        {/* Pending Assignments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
              <span>Pending Assignments</span>
            </h3>
            <button onClick={() => navigate('/student/assignments')} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                    <p className="text-[11px] text-slate-500">{a.subject_name} | Due: {new Date(a.due_date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => navigate('/student/submissions')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shadow-sm"
                  >
                    Submit
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No pending assignments!</p>
            )}
          </div>
        </div>
      </div>

      {/* Subject Attendance Summary & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Attendance List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>Subject-wise Attendance</span>
          </h3>
          <div className="flex-1 space-y-3">
            {subjectAtt.length > 0 ? (
              subjectAtt.map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{sub.subjectName}</span>
                    <span className={sub.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}>{sub.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${sub.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No subject attendance records yet.</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            <span>Recent Announcements</span>
          </h3>
          <div className="flex-1 space-y-3">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                    <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">No announcements posted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
