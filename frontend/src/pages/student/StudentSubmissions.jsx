import React, { useEffect, useState, useCallback } from 'react';
import { getAssignmentsApi, submitAssignmentApi, getMySubmissionsApi } from '../../api/assignment.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { Send, Upload, Download, CheckCircle, Clock } from 'lucide-react';

const StudentSubmissions = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Submission Modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignRes, subRes] = await Promise.all([getAssignmentsApi(), getMySubmissionsApi()]);

      if (assignRes.success && subRes.success) {
        setAssignments(assignRes.data || []);
        setSubmissions(subRes.data || []);
      } else {
        setError(assignRes.message || subRes.message || 'Failed to load assignment data.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText('');
    setFile(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !file) {
      setModalError('Please enter submission text or attach a file.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      const formData = new FormData();
      if (submissionText) formData.append('submissionText', submissionText);
      if (file) formData.append('file', file);

      const res = await submitAssignmentApi(selectedAssignment.id, formData);
      if (res.success) {
        setModalSuccess('Assignment submitted successfully!');
        setTimeout(() => {
          setSelectedAssignment(null);
          fetchData();
        }, 1200);
      } else {
        setModalError(res.message || 'Failed to submit assignment.');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Merge assignments with submissions
  const combinedList = assignments.map((a) => {
    const sub = submissions.find((s) => s.assignment_id === a.id);
    return {
      ...a,
      submission: sub || null
    };
  });

  const columns = [
    {
      header: 'Assignment & Subject',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs font-semibold text-primary-700">{row.subject_name}</p>
        </div>
      )
    },
    { header: 'Due Date', accessor: 'due_date', render: (row) => <span className="font-mono text-xs text-rose-600 font-bold">{new Date(row.due_date).toLocaleDateString()}</span> },
    {
      header: 'Submission Status',
      accessor: 'submission',
      render: (row) => {
        if (!row.submission) {
          return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
        }
        return (
          <div className="space-y-0.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${row.submission.is_late ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {row.submission.is_late ? 'Submitted (Late)' : 'Submitted (On Time)'}
            </span>
            <p className="text-[10px] text-slate-400">{new Date(row.submission.submitted_at).toLocaleDateString()}</p>
          </div>
        );
      }
    },
    {
      header: 'Marks & Feedback',
      accessor: 'submission',
      render: (row) => {
        if (!row.submission) return <span className="text-xs text-slate-400">—</span>;
        if (row.submission.marks_obtained !== null && row.submission.marks_obtained !== undefined) {
          return (
            <div>
              <span className="font-bold text-emerald-700">{row.submission.marks_obtained} / {row.maximum_marks}</span>
              {row.submission.feedback && <p className="text-[11px] text-slate-500 italic">"{row.submission.feedback}"</p>}
            </div>
          );
        }
        return <span className="text-xs font-semibold text-amber-600">Pending Evaluation</span>;
      }
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => handleOpenSubmitModal(row)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{row.submission ? 'Resubmit / Edit' : 'Submit Work'}</span>
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignment Submissions" description="Submit solution files and view teacher evaluations" />
        <LoadingTable rows={6} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignment Submissions" description="Submit solution files and view teacher evaluations" />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assignment Submissions"
        description="Upload completed assignment solution files, write submission notes, and review teacher marks and feedback"
      />

      <DataTable columns={columns} data={combinedList} emptyTitle="No course assignments found" />

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Assignment</h3>
                <p className="text-xs text-slate-500">{selectedAssignment.title} ({selectedAssignment.subject_name})</p>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            {modalError && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">{modalError}</div>}
            {modalSuccess && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">{modalSuccess}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Notes / Comments</label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter your answers or submission comments..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attach Solution File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissions;
