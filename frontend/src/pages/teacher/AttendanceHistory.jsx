import React, { useEffect, useState, useCallback } from 'react';
import {
  getAttendanceSessionsApi,
  getAttendanceSessionByIdApi,
  correctAttendanceRecordApi,
  getTeacherClassesApi
} from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import FilterBar from '../../components/common/FilterBar';
import { Eye, Edit3, AlertCircle } from 'lucide-react';

const AttendanceHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [classesOptions, setClassesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Correction Modal
  const [isCorrectOpen, setIsCorrectOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({ newStatus: 'present', correctionReason: '' });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await getTeacherClassesApi();
      if (res.success) {
        setClassesOptions(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAttendanceSessionsApi({
        classId: classFilter,
        date: dateFilter
      });
      if (res.success) {
        setSessions(res.data || []);
      } else {
        setError(res.message || 'Failed to load attendance sessions.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [classFilter, dateFilter]);

  useEffect(() => {
    fetchAssignments();
    fetchSessions();
  }, [fetchAssignments, fetchSessions]);

  const handleOpenViewDetails = async (session) => {
    setIsViewOpen(true);
    setLoadingDetails(true);
    try {
      const res = await getAttendanceSessionByIdApi(session.id || session.session_id);
      if (res.success) {
        setSelectedSessionDetails(res.data);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectionForm({ newStatus: record.status || 'present', correctionReason: '' });
    setFormError('');
    setIsCorrectOpen(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!correctionForm.correctionReason || correctionForm.correctionReason.trim().length < 3) {
      setFormError('Correction reason is mandatory (minimum 3 characters).');
      return;
    }

    try {
      setSubmittingCorrection(true);
      const res = await correctAttendanceRecordApi(selectedRecord.id || selectedRecord.record_id, {
        newStatus: correctionForm.newStatus,
        correctionReason: correctionForm.correctionReason
      });
      if (res.success) {
        setIsCorrectOpen(false);
        if (selectedSessionDetails) {
          handleOpenViewDetails({ id: selectedSessionDetails.session.id });
        }
        fetchSessions();
      } else {
        setFormError(res.message || 'Correction submission failed.');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating attendance record.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const columns = [
    {
      header: 'Session Date',
      accessor: 'attendance_date',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.attendance_date ? new Date(row.attendance_date).toLocaleDateString() : 'N/A'}</span>
          <p className="text-xs text-slate-400">Lec {row.lecture_number} ({row.start_time} - {row.end_time})</p>
        </div>
      )
    },
    {
      header: 'Class / Section',
      accessor: 'class_name',
      render: (row) => `${row.class_name} - ${row.section_name}`
    },
    { header: 'Subject', accessor: 'subject_name', render: (row) => <span className="font-semibold text-primary-700">{row.subject_name}</span> },
    {
      header: 'Present / Absent',
      accessor: 'total_present',
      render: (row) => (
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="text-emerald-700 font-bold">{row.total_present ?? 0} Pres</span>
          <span className="text-slate-300">/</span>
          <span className="text-rose-700 font-bold">{row.total_absent ?? 0} Abs</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => handleOpenViewDetails(row)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center space-x-1 text-xs font-semibold"
        >
          <Eye className="w-4 h-4" />
          <span>View Session</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History & Correction"
        description="Review submitted attendance logs and request record corrections with mandatory reason audit"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <FilterBar
          filters={[
            {
              key: 'classId',
              value: classFilter,
              options: [
                { label: 'All Assigned Classes', value: '' },
                ...classesOptions.map((c) => ({ label: `${c.class_name} - ${c.section_name} (${c.subject_name})`, value: c.class_id }))
              ]
            }
          ]}
          onChange={(k, v) => setClassFilter(v)}
        />
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-500 uppercase">Filter Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        isLoading={loading}
        error={error}
        onRetry={fetchSessions}
        emptyTitle="No attendance logs found"
        emptyDescription="No attendance sessions have been submitted for the selected filter parameters."
      />

      {/* View Session Details Modal */}
      <FormModal isOpen={isViewOpen} title="Attendance Session Records" onClose={() => setIsViewOpen(false)}>
        {loadingDetails ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading session details...</div>
        ) : selectedSessionDetails ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedSessionDetails.session.class_name} - {selectedSessionDetails.session.section_name} | {selectedSessionDetails.session.subject_name}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Date: {new Date(selectedSessionDetails.session.attendance_date).toLocaleDateString()} | Lec {selectedSessionDetails.session.lecture_number}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-primary-100 text-primary-800 font-bold">
                  {selectedSessionDetails.session.attendance_percentage || 0}% Present
                </span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border rounded-xl divide-y text-xs">
              {selectedSessionDetails.records?.map((rec) => (
                <div key={rec.id || rec.record_id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{rec.student_name}</span>
                    <span className="ml-2 text-slate-400">Roll: {rec.roll_number}</span>
                    {rec.remarks && <p className="text-[11px] text-slate-500 italic mt-0.5">Remark: {rec.remarks}</p>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={rec.status} />
                    <button
                      onClick={() => handleOpenCorrection(rec)}
                      className="p-1 rounded text-primary-600 hover:bg-primary-50"
                      title="Correct Status"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No details available.</p>
        )}
      </FormModal>

      {/* Attendance Record Correction Modal */}
      <FormModal isOpen={isCorrectOpen} title="Correct Student Attendance Record" onClose={() => setIsCorrectOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        {selectedRecord && (
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border text-xs space-y-1">
              <p><span className="font-semibold text-slate-500">Student:</span> <span className="font-bold text-slate-900">{selectedRecord.student_name}</span></p>
              <p><span className="font-semibold text-slate-500">Old Status:</span> <StatusBadge status={selectedRecord.status} /></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Attendance Status *</label>
              <select
                value={correctionForm.newStatus}
                onChange={(e) => setCorrectionForm({ ...correctionForm, newStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Correction Reason (Mandatory) *</label>
              <textarea
                required
                rows="3"
                value={correctionForm.correctionReason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                placeholder="Reason for changing status (e.g. Approved medical leave note submitted)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsCorrectOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={submittingCorrection} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                Submit Correction
              </button>
            </div>
          </form>
        )}
      </FormModal>
    </div>
  );
};

export default AttendanceHistory;
