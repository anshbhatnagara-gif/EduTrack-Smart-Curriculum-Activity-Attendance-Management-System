import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssignmentsApi } from '../../api/assignment.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { ClipboardCheck, Download, Send } from 'lucide-react';

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAssignmentsApi();
      if (res.success) {
        setAssignments(res.data || []);
      } else {
        setError(res.message || 'Failed to load assignments.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const columns = [
    {
      header: 'Assignment Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs text-slate-500 line-clamp-1">{row.description || 'No description provided.'}</p>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject_name', render: (row) => <span className="font-semibold text-primary-700">{row.subject_name}</span> },
    { header: 'Teacher', accessor: 'teacher_name' },
    { header: 'Due Date', accessor: 'due_date', render: (row) => <span className="font-mono text-xs text-rose-600 font-bold">{new Date(row.due_date).toLocaleDateString()}</span> },
    { header: 'Max Marks', accessor: 'maximum_marks', render: (row) => <span className="font-bold text-slate-800">{row.maximum_marks}</span> },
    {
      header: 'Attachment',
      accessor: 'attachment_url',
      render: (row) =>
        row.attachment_url ? (
          <a
            href={`http://localhost:5000${row.attachment_url}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-primary-600 font-bold hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Attachment</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        )
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => navigate('/student/submissions')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submissions</span>
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course Assignments" description="Class assignments, homework tasks, and submission deadlines" />
        <LoadingTable rows={6} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course Assignments" description="Class assignments, homework tasks, and submission deadlines" />
        <ErrorState message={error} onRetry={fetchAssignments} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Assignments"
        description="View published class assignments, instructions, max score weights, and submission deadlines"
      />

      <DataTable columns={columns} data={assignments} emptyTitle="No active assignments for your class section" />
    </div>
  );
};

export default StudentAssignments;
