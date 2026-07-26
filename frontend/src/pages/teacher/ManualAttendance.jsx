import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getTeacherClassesApi,
  getAttendanceStudentsApi,
  submitAttendanceApi
} from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { CheckSquare, UserCheck, UserX, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ManualAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Form Selections
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [lectureNumber, setLectureNumber] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Roster & Attendance state
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status: 'present', remarks: '' } }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      const res = await getTeacherClassesApi();
      if (res.success) {
        setAssignments(res.data || []);

        // Check if query params provided
        const qClassId = searchParams.get('classId');
        const qSectionId = searchParams.get('sectionId');
        const qSubjectId = searchParams.get('subjectId');

        if (qClassId && qSectionId && qSubjectId) {
          const match = res.data.find(
            (a) =>
              String(a.class_id) === String(qClassId) &&
              String(a.section_id) === String(qSectionId) &&
              String(a.subject_id) === String(qSubjectId)
          );
          if (match) {
            setSelectedAssignmentKey(`${match.class_id}_${match.section_id}_${match.subject_id}`);
          }
        } else if (res.data.length > 0) {
          const first = res.data[0];
          setSelectedAssignmentKey(`${first.class_id}_${first.section_id}_${first.subject_id}`);
        }
      }
    } catch (err) {
      setError('Failed to load teacher class assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const fetchRoster = useCallback(async () => {
    if (!selectedAssignmentKey) return;
    const [classId, sectionId] = selectedAssignmentKey.split('_');

    try {
      setLoadingStudents(true);
      setError('');
      setSuccessMsg('');
      const res = await getAttendanceStudentsApi({ classId, sectionId });
      if (res.success) {
        const list = res.data || [];
        setStudents(list);

        // Initialize records with default 'present'
        const initial = {};
        list.forEach((s) => {
          initial[s.student_id || s.id] = { status: 'present', remarks: '' };
        });
        setAttendanceRecords(initial);
      } else {
        setError(res.message || 'Failed to load class roster.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching student roster.');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedAssignmentKey]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceRecords };
    students.forEach((s) => {
      const id = s.student_id || s.id;
      updated[id] = { ...updated[id], status };
    });
    setAttendanceRecords(updated);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedAssignmentKey) {
      setError('Please select a class and subject.');
      return;
    }

    const [classId, sectionId, subjectId] = selectedAssignmentKey.split('_');

    const recordsArray = students.map((s) => {
      const id = s.student_id || s.id;
      const rec = attendanceRecords[id] || { status: 'present', remarks: '' };
      return {
        studentId: id,
        status: rec.status,
        remarks: rec.remarks
      };
    });

    const currentMatch = assignments.find(
      (a) =>
        String(a.class_id) === String(classId) &&
        String(a.section_id) === String(sectionId) &&
        String(a.subject_id) === String(subjectId)
    );

    const payload = {
      classId: parseInt(classId, 10),
      sectionId: parseInt(sectionId, 10),
      subjectId: parseInt(subjectId, 10),
      academicSessionId: currentMatch?.academic_session_id ? parseInt(currentMatch.academic_session_id, 10) : 1,
      attendanceDate,
      lectureNumber: parseInt(lectureNumber, 10),
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      records: recordsArray
    };

    try {
      setSubmitting(true);
      const res = await submitAttendanceApi(payload);
      if (res.success) {
        setSuccessMsg(`Attendance marked successfully for ${recordsArray.length} students!`);
        setTimeout(() => {
          navigate('/teacher/attendance/history');
        }, 1500);
      } else {
        setError(res.message || 'Failed to submit attendance.');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Attendance submission error or duplicate session.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Counters
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  students.forEach((s) => {
    const id = s.student_id || s.id;
    const st = attendanceRecords[id]?.status;
    if (st === 'present') presentCount++;
    else if (st === 'absent') absentCount++;
    else if (st === 'late') lateCount++;
    else if (st === 'excused') excusedCount++;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Manual Attendance"
        description="Select assigned class section, lecture slot, and mark student presence status"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Selection Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Class & Subject *</label>
            <select
              value={selectedAssignmentKey}
              onChange={(e) => setSelectedAssignmentKey(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {assignments.map((a) => (
                <option key={`${a.class_id}_${a.section_id}_${a.subject_id}`} value={`${a.class_id}_${a.section_id}_${a.subject_id}`}>
                  {a.class_name} - {a.section_name} | {a.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Attendance Date *</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Lecture No *</label>
            <input
              type="number"
              min="1"
              max="10"
              value={lectureNumber}
              onChange={(e) => setLectureNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table Section */}
      {loadingStudents ? (
        <LoadingTable rows={6} cols={5} />
      ) : students.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-slate-500 text-sm">
          No enrolled students found for the selected class section.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Bar & Realtime Counters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800">Present: {presentCount}</span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800">Absent: {absentCount}</span>
              <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800">Late: {lateCount}</span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800">Excused: {excusedCount}</span>
              <span className="text-slate-400">Total: {students.length}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const id = s.student_id || s.id;
                    const rec = attendanceRecords[id] || { status: 'present', remarks: '' };

                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{s.roll_number || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.full_name}</td>
                        <td className="px-4 py-3 text-slate-500">{s.admission_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1.5">
                            {[
                              { label: 'Present', val: 'present', color: 'peer-checked:bg-emerald-600 peer-checked:text-white' },
                              { label: 'Absent', val: 'absent', color: 'peer-checked:bg-rose-600 peer-checked:text-white' },
                              { label: 'Late', val: 'late', color: 'peer-checked:bg-amber-600 peer-checked:text-white' },
                              { label: 'Excused', val: 'excused', color: 'peer-checked:bg-blue-600 peer-checked:text-white' }
                            ].map((opt) => (
                              <label key={opt.val} className="cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status_${id}`}
                                  value={opt.val}
                                  checked={rec.status === opt.val}
                                  onChange={() => handleStatusChange(id, opt.val)}
                                  className="peer sr-only"
                                />
                                <span className={`px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold transition-colors ${opt.color}`}>
                                  {opt.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={rec.remarks}
                            onChange={(e) => handleRemarksChange(id, e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 shadow-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting Attendance...' : 'Save & Submit Attendance'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ManualAttendance;
