import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getExamsApi, recordMarksApi } from '../../api/marks.api';
import { getTeacherClassesApi, getAttendanceStudentsApi } from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import LoadingTable from '../../components/feedback/LoadingTable';
import { Award, AlertCircle, CheckCircle2, Save } from 'lucide-react';

const TeacherMarks = () => {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [classesOptions, setClassesOptions] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState('');

  const [students, setStudents] = useState([]);
  const [marksState, setMarksState] = useState({}); // { studentId: { marksObtained: '', maxMarks: 100, remarks: '' } }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOptions = useCallback(async () => {
    try {
      const [exRes, clRes] = await Promise.all([
        getExamsApi(),
        getTeacherClassesApi()
      ]);
      if (exRes.success) {
        const exList = exRes.data || [];
        setExams(exList);
        if (exList.length > 0) setSelectedExamId(exList[0].id);
      }
      if (clRes.success) {
        const clList = clRes.data || [];
        setClassesOptions(clList);

        const qClassId = searchParams.get('classId');
        const qSubjectId = searchParams.get('subjectId');
        if (qClassId && qSubjectId) {
          const match = clList.find(c => String(c.class_id) === String(qClassId) && String(c.subject_id) === String(qSubjectId));
          if (match) {
            setSelectedAssignmentKey(`${match.class_id}_${match.section_id}_${match.subject_id}`);
          }
        } else if (clList.length > 0) {
          const first = clList[0];
          setSelectedAssignmentKey(`${first.class_id}_${first.section_id}_${first.subject_id}`);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fetchStudentsRoster = useCallback(async () => {
    if (!selectedAssignmentKey) return;
    const [classId, sectionId] = selectedAssignmentKey.split('_');

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const res = await getAttendanceStudentsApi({ classId, sectionId });
      if (res.success) {
        const list = res.data || [];
        setStudents(list);

        const initial = {};
        list.forEach((s) => {
          const id = s.student_id || s.id;
          initial[id] = { marksObtained: '', maxMarks: 100, remarks: '' };
        });
        setMarksState(initial);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignmentKey]);

  useEffect(() => {
    fetchStudentsRoster();
  }, [fetchStudentsRoster]);

  const handleMarkChange = (studentId, field, val) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: val }
    }));
  };

  const calculateGrade = (obtained, max) => {
    const p = (parseFloat(obtained) / parseFloat(max)) * 100;
    if (isNaN(p)) return '—';
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedExamId || !selectedAssignmentKey) {
      setError('Please select an Exam and Class Subject.');
      return;
    }

    const [classId, sectionId, subjectId] = selectedAssignmentKey.split('_');

    const marksList = students
      .map((s) => {
        const id = s.student_id || s.id;
        const entry = marksState[id];
        if (entry && entry.marksObtained !== '' && entry.marksObtained !== null) {
          return {
            studentId: id,
            marksObtained: parseFloat(entry.marksObtained),
            maxMarks: parseFloat(entry.maxMarks || 100),
            remarks: entry.remarks || ''
          };
        }
        return null;
      })
      .filter(Boolean);

    if (marksList.length === 0) {
      setError('Please enter marks for at least one student before saving.');
      return;
    }

    const payload = {
      examId: parseInt(selectedExamId, 10),
      classId: parseInt(classId, 10),
      sectionId: parseInt(sectionId, 10),
      subjectId: parseInt(subjectId, 10),
      marks: marksList
    };

    try {
      setSubmitting(true);
      const res = await recordMarksApi(payload);
      if (res.success) {
        setSuccessMsg(`Successfully saved marks for ${marksList.length} students!`);
      } else {
        setError(res.message || 'Failed to save marks.');
      }
    } catch (err) {
      setError(err.message || 'Error recording marks.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams & Marks Entry"
        description="Select exam session, enter student scores, preview calculated letter grades, and bulk save"
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

      {/* Selectors Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Select Examination *</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.exam_type || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Class & Subject *</label>
            <select
              value={selectedAssignmentKey}
              onChange={(e) => setSelectedAssignmentKey(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {classesOptions.map((a) => (
                <option key={`${a.class_id}_${a.section_id}_${a.subject_id}`} value={`${a.class_id}_${a.section_id}_${a.subject_id}`}>
                  {a.class_name} - {a.section_name} | {a.subject_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster & Marks Table */}
      {loading ? (
        <LoadingTable rows={6} cols={5} />
      ) : students.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-slate-500 text-sm">
          No students found for the selected class section.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Max Marks</th>
                    <th className="px-4 py-3">Marks Obtained</th>
                    <th className="px-4 py-3">Grade Preview</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const id = s.student_id || s.id;
                    const entry = marksState[id] || { marksObtained: '', maxMarks: 100, remarks: '' };
                    const grade = calculateGrade(entry.marksObtained, entry.maxMarks);

                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{s.roll_number || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.full_name}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entry.maxMarks}
                            onChange={(e) => handleMarkChange(id, 'maxMarks', e.target.value)}
                            className="w-20 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={entry.maxMarks}
                            value={entry.marksObtained}
                            onChange={(e) => handleMarkChange(id, 'marksObtained', e.target.value)}
                            placeholder="Enter marks..."
                            className="w-28 px-2.5 py-1 text-xs border rounded font-semibold text-slate-900 focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : grade === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.remarks}
                            onChange={(e) => handleMarkChange(id, 'remarks', e.target.value)}
                            placeholder="Performance note..."
                            className="w-full px-2.5 py-1 text-xs border rounded focus:ring-1 focus:ring-primary-500"
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
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Marks...' : 'Bulk Save Marks'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TeacherMarks;
