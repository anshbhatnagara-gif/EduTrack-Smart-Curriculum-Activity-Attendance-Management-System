import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import { getTeacherDashboardApi, exportAttendanceReportApi, exportPerformanceReportApi } from '../../api/report.api';
import { Download, FileText, RefreshCw, BarChart2, Shield } from 'lucide-react';

const TeacherReports = () => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        setLoading(true);
        const res = await getTeacherDashboardApi();
        setAssignedClasses(res.data.data.assignedClasses || []);
      } catch (err) {
        setError('Failed to load assigned classes for reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherInfo();
  }, []);

  const handleExportAttendance = async (format) => {
    try {
      setExporting(true);
      const params = { format };
      if (selectedClass) {
        const [cId, sId, subId] = selectedClass.split('-');
        params.classId = cId;
        params.sectionId = sId;
        params.subjectId = subId;
      }

      const res = await exportAttendanceReportApi(params);
      const blob = new Blob([res.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Teacher_Attendance_Report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export attendance report.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPerformance = async (format) => {
    try {
      setExporting(true);
      const params = { format };
      if (selectedClass) {
        const [cId, sId, subId] = selectedClass.split('-');
        params.classId = cId;
        params.sectionId = sId;
        params.subjectId = subId;
      }

      const res = await exportPerformanceReportApi(params);
      const blob = new Blob([res.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Teacher_Performance_Report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export performance report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        Loading assigned classes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Reports & Exports"
        description="Export PDF and Excel reports for your assigned classes, sections and subjects"
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Scope Restriction Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center space-x-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <span>Export authorization is automatically restricted to your assigned classes and subjects.</span>
      </div>

      {/* Class Selector Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-semibold text-slate-800">Select Target Assignment</h3>
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Assigned Class & Subject
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="">All My Assigned Classes</option>
            {assignedClasses.map((item) => (
              <option key={item.id} value={`${item.class_id}-${item.section_id}-${item.subject_id}`}>
                {item.class_name} - {item.section_name} ({item.subject_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Export Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Attendance Report</h4>
              <p className="text-xs text-slate-500">Export student attendance logs and status breakdowns</p>
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              disabled={exporting}
              onClick={() => handleExportAttendance('pdf')}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
            <button
              disabled={exporting}
              onClick={() => handleExportAttendance('excel')}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Performance Export Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Academic Performance Report</h4>
              <p className="text-xs text-slate-500">Export exam scores, marks obtained and grade classifications</p>
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              disabled={exporting}
              onClick={() => handleExportPerformance('pdf')}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
            <button
              disabled={exporting}
              onClick={() => handleExportPerformance('excel')}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
