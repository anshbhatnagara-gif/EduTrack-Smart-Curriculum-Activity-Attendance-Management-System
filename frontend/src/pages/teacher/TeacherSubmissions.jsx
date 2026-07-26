import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAssignmentsApi,
  getSubmissionsByAssignmentApi,
  evaluateSubmissionApi
} from '../../api/assignment.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { FileCheck, Download, Edit3, AlertCircle } from 'lucide-react';

const TeacherSubmissions = () => {
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evalForm, setEvalForm] = useState({ marksObtained: 0, feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await getAssignmentsApi();
      if (res.success) {
        const list = res.data || [];
        setAssignments(list);

        const qId = searchParams.get('assignmentId');
        if (qId && list.some((a) => String(a.id) === String(qId))) {
          setSelectedAssignmentId(qId);
        } else if (list.length > 0) {
          setSelectedAssignmentId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  }, [searchParams]);

  const fetchSubmissions = useCallback(async () => {
    if (!selectedAssignmentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getSubmissionsByAssignmentApi(selectedAssignmentId);
      if (res.success) {
        setSubmissions(res.data || []);
      } else {
        setError(res.message || 'Failed to load submissions.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching submissions.');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const currentAssignment = assignments.find((a) => String(a.id) === String(selectedAssignmentId));

  const handleOpenEvaluate = (sub) => {
    setSelectedSubmission(sub);
    setEvalForm({
      marksObtained: sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained : 0,
      feedback: sub.feedback || ''
    });
    setFormError('');
    setIsEvalOpen(true);
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const maxMarks = currentAssignment?.max_marks || 100;
    if (evalForm.marksObtained < 0 || evalForm.marksObtained > maxMarks) {
      setFormError(`Marks obtained must be between 0 and maximum marks (${maxMarks}).`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await evaluateSubmissionApi(selectedSubmission.id, {
        marksObtained: parseFloat(evalForm.marksObtained),
        feedback: evalForm.feedback
      });
      if (res.success) {
        setIsEvalOpen(false);
        fetchSubmissions();
      } else {
        setFormError(res.message || 'Evaluation submission failed.');
      }
    } catch (err) {
      setFormError(err.message || 'Error evaluating submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'student_name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.student_name}</span>
          <p className="text-xs text-slate-400">Roll: {row.roll_number} | Adm: {row.admission_number}</p>
        </div>
      )
    },
    {
      header: 'Submitted At',
      accessor: 'submitted_at',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : 'N/A'}</span>
          {row.is_late ? (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">LATE</span>
          ) : (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">ON TIME</span>
          )}
        </div>
      )
    },
    {
      header: 'Attachment',
      accessor: 'file_url',
      render: (row) => (
        row.file_url ? (
          <a href={`http://localhost:5000${row.file_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-600 hover:underline">
            <Download className="w-3.5 h-3.5" />
            <span>Submission File</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">No File</span>
        )
      )
    },
    {
      header: 'Score / Max',
      accessor: 'marks_obtained',
      render: (row) => (
        row.marks_obtained !== null && row.marks_obtained !== undefined ? (
          <span className="font-bold text-slate-900">{row.marks_obtained} / {currentAssignment?.max_marks}</span>
        ) : (
          <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">Pending Grade</span>
        )
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => handleOpenEvaluate(row)}
          className="p-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 flex items-center space-x-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Evaluate</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Assignment Submissions"
        description="Review submitted homework attachments, assess on-time status, and grade work"
      />

      {/* Assignment Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Assignment:</label>
        <select
          value={selectedAssignmentId}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} ({a.class_name} - {a.section_name} | Max: {a.max_marks})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        isLoading={loading}
        error={error}
        onRetry={fetchSubmissions}
        emptyTitle="No submissions recorded"
        emptyDescription="Students have not uploaded any submissions for this assignment yet."
      />

      {/* Evaluate Submission Modal */}
      <FormModal isOpen={isEvalOpen} title="Evaluate Submission" onClose={() => setIsEvalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {selectedSubmission && (
          <form onSubmit={handleEvaluateSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border text-xs space-y-1">
              <p><span className="font-semibold text-slate-500">Student:</span> <span className="font-bold text-slate-900">{selectedSubmission.student_name}</span></p>
              <p><span className="font-semibold text-slate-500">Assignment:</span> <span className="font-semibold text-slate-800">{currentAssignment?.title}</span></p>
              <p><span className="font-semibold text-slate-500">Maximum Marks:</span> <span className="font-bold text-slate-900">{currentAssignment?.max_marks}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Marks Obtained (0 - {currentAssignment?.max_marks}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={currentAssignment?.max_marks || 100}
                required
                value={evalForm.marksObtained}
                onChange={(e) => setEvalForm({ ...evalForm, marksObtained: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Feedback / Comments</label>
              <textarea
                rows="3"
                value={evalForm.feedback}
                onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                placeholder="Constructive feedback for the student..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsEvalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                Save Evaluation
              </button>
            </div>
          </form>
        )}
      </FormModal>
    </div>
  );
};

export default TeacherSubmissions;
