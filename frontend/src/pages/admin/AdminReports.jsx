import React, { useEffect, useState, useCallback } from 'react';
import {
  getAdminDashboardApi,
  getAttendanceReportApi,
  getPerformanceReportApi
} from '../../api/report.api';
import {
  getClassesApi,
  getSectionsApi,
  getSubjectsApi
} from '../../api/academic.api';
import { getStudentsApi } from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { AlertCircle, Download, FileText, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1'];

const AdminReports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [performanceReport, setPerformanceReport] = useState([]);
  
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Lookups
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // Filters - Attendance
  const [attClassId, setAttClassId] = useState('');
  const [attSectionId, setAttSectionId] = useState('');
  const [attSubjectId, setAttSubjectId] = useState('');
  const [attStudentId, setAttStudentId] = useState('');
  const [attStartDate, setAttStartDate] = useState('');
  const [attEndDate, setAttEndDate] = useState('');

  // Filters - Performance
  const [perfClassId, setPerfClassId] = useState('');

  const [error, setError] = useState('');

  const fetchLookups = useCallback(async () => {
    try {
      const [clsRes, subRes, stuRes] = await Promise.all([
        getClassesApi(),
        getSubjectsApi(),
        getStudentsApi({ limit: 1000 })
      ]);
      if (clsRes.success) setClasses(clsRes.data || []);
      if (subRes.success) setSubjects(subRes.data || []);
      if (stuRes.success) setStudents(stuRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setError('');
      const res = await getAdminDashboardApi();
      if (res.success) setDashboard(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
    fetchDashboard();
  }, [fetchLookups, fetchDashboard]);

  const handleAttClassChange = async (e) => {
    const val = e.target.value;
    setAttClassId(val);
    setAttSectionId('');
    if (!val) {
      setSections([]);
      return;
    }
    try {
      const res = await getSectionsApi({ classId: val });
      if (res.success) setSections(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setLoadingAttendance(true);
      const params = {};
      if (attClassId) params.classId = attClassId;
      if (attSectionId) params.sectionId = attSectionId;
      if (attSubjectId) params.subjectId = attSubjectId;
      if (attStudentId) params.studentId = attStudentId;
      if (attStartDate) params.startDate = attStartDate;
      if (attEndDate) params.endDate = attEndDate;

      const res = await getAttendanceReportApi(params);
      if (res.success) setAttendanceReport(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to fetch attendance report');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchPerformanceReport = async () => {
    if (!perfClassId) {
      alert('Please select a class for the performance report');
      return;
    }
    try {
      setLoadingPerformance(true);
      const res = await getPerformanceReportApi({ classId: perfClassId });
      if (res.success) setPerformanceReport(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to fetch performance report');
    } finally {
      setLoadingPerformance(false);
    }
  };

  const attColumns = [
    { header: 'Date', accessor: 'attendance_date', render: (row) => new Date(row.attendance_date).toLocaleDateString() },
    { header: 'Student', accessor: 'student_name' },
    { header: 'Admission #', accessor: 'admission_number' },
    { header: 'Subject', accessor: 'subject_name' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`capitalize px-2 py-1 rounded-md text-xs font-semibold ${
          row.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
          row.status === 'absent' ? 'bg-rose-100 text-rose-700' :
          row.status === 'late' ? 'bg-amber-100 text-amber-700' :
          'bg-indigo-100 text-indigo-700'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Remarks', accessor: 'remarks', render: (row) => <span className="text-sm text-slate-500">{row.remarks || '-'}</span> }
  ];

  const perfColumns = [
    { header: 'Student', accessor: 'studentName', render: (row) => <span className="font-semibold text-slate-900">{row.studentName}</span> },
    { header: 'Admn #', accessor: 'admissionNumber' },
    { header: 'Section', accessor: 'sectionName' },
    { 
      header: 'Attendance %', 
      accessor: 'attendancePercentage',
      render: (row) => (
        <span className={row.attendancePercentage < 75 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
          {parseFloat(row.attendancePercentage).toFixed(2)}%
        </span>
      )
    },
    { 
      header: 'Marks Average', 
      accessor: 'marksPercentage',
      render: (row) => (
        <span className={row.marksPercentage < 50 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
          {parseFloat(row.marksPercentage).toFixed(2)}%
        </span>
      )
    },
    { header: 'Pending Assignments', accessor: 'pendingAssignments' },
    { 
      header: 'Risk Category', 
      accessor: 'riskAnalysis',
      render: (row) => {
        const cat = row.riskAnalysis?.category;
        const color = cat === 'GOOD' ? 'bg-emerald-100 text-emerald-700' :
                      cat === 'AT_RISK' ? 'bg-rose-100 text-rose-700' :
                      cat === 'NEEDS_ATTENTION' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700';
        return (
          <div className="flex flex-col space-y-1">
            <span className={`px-2 py-1 rounded-md text-xs font-semibold w-max ${color}`}>
              {cat?.replace('_', ' ')}
            </span>
            {row.riskAnalysis?.reasons?.map((r, i) => (
              <span key={i} className="text-[10px] text-slate-500">{r}</span>
            ))}
          </div>
        );
      }
    }
  ];

  if (loadingDashboard) {
    return <div className="p-12 text-center text-slate-500">Loading reports data...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
        <p className="font-semibold text-lg flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const { todayAttendance, monthlyAttendanceChart, lowAttendanceStudents } = dashboard;
  
  const pieData = [
    { name: 'Present', value: todayAttendance?.present || 0 },
    { name: 'Absent', value: todayAttendance?.absent || 0 },
    { name: 'Late', value: todayAttendance?.late || 0 },
    { name: 'Leave', value: todayAttendance?.leave || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="School Reports & Analytics"
        description="Comprehensive insights into attendance, performance, and student metrics."
      />

      {/* DASHBOARD OVERVIEW */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary-600" /> Today's Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Present Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{todayAttendance?.present || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Absent Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{todayAttendance?.absent || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Late Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{todayAttendance?.late || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">On Leave Today</p>
              <h3 className="text-2xl font-bold text-slate-900">{todayAttendance?.leave || 0}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CHARTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Today's Attendance Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">No attendance marked today</div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Monthly Attendance Trends</h3>
          {monthlyAttendanceChart && monthlyAttendanceChart.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyAttendanceChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="present" name="Present/Late" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-slate-500">No monthly data available</div>
          )}
        </div>
      </section>

      {/* DETAILED ATTENDANCE REPORT */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold text-slate-800">Detailed Attendance Report</h2>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <select value={attClassId} onChange={handleAttClassChange} className="w-full px-2 py-1.5 border rounded-md text-xs">
              <option value="">All</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
            <select value={attSectionId} onChange={e => setAttSectionId(e.target.value)} disabled={!attClassId} className="w-full px-2 py-1.5 border rounded-md text-xs">
              <option value="">All</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <select value={attSubjectId} onChange={e => setAttSubjectId(e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-xs">
              <option value="">All</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
            <select value={attStudentId} onChange={e => setAttStudentId(e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-xs">
              <option value="">All</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input type="date" value={attStartDate} onChange={e => setAttStartDate(e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input type="date" value={attEndDate} onChange={e => setAttEndDate(e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-xs" />
          </div>
          <div className="lg:col-span-6 flex justify-end">
            <button onClick={fetchAttendanceReport} disabled={loadingAttendance} className="inline-flex items-center px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingAttendance ? 'animate-spin' : ''}`} />
              Generate Report
            </button>
          </div>
        </div>

        <DataTable columns={attColumns} data={attendanceReport} isLoading={loadingAttendance} emptyTitle="Generate report to view data" />
      </section>

      {/* DETAILED PERFORMANCE REPORT */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold text-slate-800">Class Performance & Risk Report</h2>
        </div>
        
        {/* Filters */}
        <div className="flex items-end gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class *</label>
            <select value={perfClassId} onChange={e => setPerfClassId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <button onClick={fetchPerformanceReport} disabled={loadingPerformance || !perfClassId} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingPerformance ? 'animate-spin' : ''}`} />
              Generate Risk Report
            </button>
          </div>
        </div>

        <DataTable columns={perfColumns} data={performanceReport} isLoading={loadingPerformance} emptyTitle="Select a class to generate the performance report" />
      </section>

    </div>
  );
};

export default AdminReports;
