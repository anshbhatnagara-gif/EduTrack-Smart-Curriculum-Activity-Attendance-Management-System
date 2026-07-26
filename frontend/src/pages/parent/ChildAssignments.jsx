import React, { useEffect, useState, useCallback } from 'react';
import { getAssignmentsApi } from '../../api/assignment.api';
import ChildSelector from '../../components/parent/ChildSelector';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { ClipboardCheck } from 'lucide-react';

const ChildAssignments = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
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
      header: 'Assignment & Subject',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs font-semibold text-primary-700">{row.subject_name}</p>
        </div>
      )
    },
    { header: 'Teacher', accessor: 'teacher_name' },
    { header: 'Due Date', accessor: 'due_date', render: (row) => <span className="font-mono text-xs text-rose-600 font-bold">{new Date(row.due_date).toLocaleDateString()}</span> },
    { header: 'Max Marks', accessor: 'maximum_marks', render: (row) => <span className="font-bold text-slate-800">{row.maximum_marks}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Child Homework Assignments"
          description="Monitor homework assignments and submission deadlines for your child"
        />
        <ChildSelector
          selectedChildId={selectedChildId}
          onSelectChild={(c) => setSelectedChildId(c.student_id || c.id)}
        />
      </div>

      {loading && <LoadingTable rows={5} cols={4} />}
      {error && <ErrorState message={error} onRetry={fetchAssignments} />}

      {!loading && !error && (
        <DataTable columns={columns} data={assignments} emptyTitle="No course assignments published for child's class" />
      )}
    </div>
  );
};

export default ChildAssignments;
