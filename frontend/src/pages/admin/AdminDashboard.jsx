import React, { useEffect, useState, useCallback } from 'react';
import { getAdminDashboardApi } from '../../api/report.api';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  UserCheck2,
  UserX,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Megaphone,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminDashboardApi();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard data.');
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
        <PageHeader title="Admin Dashboard" description="Overview of school statistics and daily operations" />
        <LoadingTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="Overview of school statistics and daily operations" />
        <ErrorState message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const counts = data?.counts || {};
  const todayAtt = data?.todayAttendance || {};
  const monthlyChart = data?.monthlyAttendanceChart || [];
  const lowAttStudents = data?.lowAttendanceStudents || [];
  const announcements = data?.recentAnnouncements || [];
  const activities = data?.recentActivities || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Real-time summary of school statistics, attendance metrics, and audit activities"
        actions={
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.students ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Teachers</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.teachers ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Parents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Parents</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.parents ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Classes</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.classes ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UserCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{todayAtt.present ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Today</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{todayAtt.absent ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{data?.overallAttendancePercentage ?? 0}%</h3>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <span>Monthly Attendance Trend</span>
        </h3>
        <div className="h-72 w-full">
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Present / Late" fill="#0c8de9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
              No monthly attendance history recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Attendance Warning Students */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Low Attendance Alerts (&lt;75%)</span>
          </h3>

          <div className="flex-1 overflow-x-auto">
            {lowAttStudents.length > 0 ? (
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Admission No</th>
                    <th className="px-3 py-2">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowAttStudents.map((s, idx) => (
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
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No low attendance warnings detected.
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
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
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No announcements posted yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity Logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <span>System Audit Activity Log</span>
        </h3>

        <div className="overflow-x-auto">
          {activities.length > 0 ? (
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{act.full_name}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={act.role} />
                    </td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{act.action}</td>
                    <td className="px-3 py-2 text-slate-500">{act.target_table} (ID: {act.target_id || 'N/A'})</td>
                    <td className="px-3 py-2 text-slate-400">{new Date(act.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs font-medium">
              No audit activities recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
