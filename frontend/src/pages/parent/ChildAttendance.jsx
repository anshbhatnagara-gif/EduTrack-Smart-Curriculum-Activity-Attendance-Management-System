import React, { useEffect, useState, useCallback } from 'react';
import { getStudentAttendanceApi } from '../../api/attendance.api';
import ChildSelector from '../../components/parent/ChildSelector';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { CheckSquare, AlertTriangle } from 'lucide-react';

const ChildAttendance = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChildAttendance = useCallback(async () => {
    if (!selectedChildId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentAttendanceApi(selectedChildId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load child attendance.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You are not authorized to view attendance records for this student.');
      } else {
        setError(err.message || 'Error connecting to server.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildAttendance();
  }, [fetchChildAttendance]);

  const overall = data?.overall || { percentage: 0, totalSessions: 0, presentCount: 0, absentCount: 0, lateCount: 0, leaveCount: 0 };
  const subjectStats = data?.subjectStats || [];
  const history = data?.history || [];

  const columns = [
    {
      header: 'Date & Slot',
      accessor: 'attendance_date',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.attendance_date ? new Date(row.attendance_date).toLocaleDateString() : 'N/A'}</span>
          <p className="text-xs text-slate-400">Lec {row.lecture_number}</p>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject_name', render: (row) => <span className="font-semibold text-primary-700">{row.subject_name}</span> },
    { header: 'Teacher', accessor: 'teacher_name' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Remarks', accessor: 'remarks', render: (row) => row.remarks || '—' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Child Attendance Report"
          description="View attendance records and subject percentages for your linked child"
        />
        <ChildSelector
          selectedChildId={selectedChildId}
          onSelectChild={(c) => setSelectedChildId(c.student_id || c.id)}
        />
      </div>

      {loading && <LoadingTable rows={5} cols={4} />}
      {error && <ErrorState message={error} onRetry={fetchChildAttendance} />}

      {!loading && !error && data && (
        <>
          {/* Overall Progress Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance Progress</h3>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className={`text-3xl font-extrabold ${overall.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {overall.percentage}%
                  </span>
                  <span className="text-xs text-slate-500">({overall.presentCount + overall.lateCount} / {overall.totalSessions} Sessions)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800">Present: {overall.presentCount}</span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800">Absent: {overall.absentCount}</span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800">Late: {overall.lateCount}</span>
                <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800">Leave: {overall.leaveCount}</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${overall.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(overall.percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {overall.percentage < 75 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Low Attendance Alert:</span> Overall attendance ({overall.percentage}%) is below 75%.
              </div>
            </div>
          )}

          {/* Subject Breakdown */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Subject Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map((sub, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900">{sub.subjectName}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${sub.percentage < 75 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Present: {sub.present} | Absent: {sub.absent} | Total: {sub.total}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Attendance Session History</h3>
            <DataTable columns={columns} data={history} emptyTitle="No attendance logs recorded" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChildAttendance;
