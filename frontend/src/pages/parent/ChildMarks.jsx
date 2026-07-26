import React, { useEffect, useState, useCallback } from 'react';
import { getStudentMarksApi } from '../../api/marks.api';
import ChildSelector from '../../components/parent/ChildSelector';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { Award } from 'lucide-react';

const ChildMarks = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChildMarks = useCallback(async () => {
    if (!selectedChildId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentMarksApi(selectedChildId);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load child marks.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You are not authorized to view exam marks for this student.');
      } else {
        setError(err.message || 'Error connecting to server.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildMarks();
  }, [fetchChildMarks]);

  const report = data?.report || data;
  const subjectMarks = report?.subjectMarks || [];
  const category = report?.category || 'AVERAGE';

  const columns = [
    { header: 'Subject', accessor: 'subjectName', render: (row) => <span className="font-bold text-slate-900">{row.subjectName}</span> },
    { header: 'Code', accessor: 'subjectCode', render: (row) => <span className="font-mono text-xs text-slate-500">{row.subjectCode}</span> },
    { header: 'Max Marks', accessor: 'maximumMarks', render: (row) => <span className="font-semibold text-slate-700">{row.maximumMarks}</span> },
    { header: 'Obtained', accessor: 'marksObtained', render: (row) => <span className="font-bold text-emerald-700">{row.marksObtained}</span> },
    { header: 'Percentage', accessor: 'percentage', render: (row) => <span className="font-bold font-mono text-slate-900">{row.percentage}%</span> },
    {
      header: 'Grade',
      accessor: 'grade',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-primary-50 text-primary-700 border border-primary-200">
          {row.grade}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Child Exam Marks & Results"
          description="Examination score cards, percentage indicators, and performance categories"
        />
        <ChildSelector
          selectedChildId={selectedChildId}
          onSelectChild={(c) => setSelectedChildId(c.student_id || c.id)}
        />
      </div>

      {loading && <LoadingTable rows={5} cols={5} />}
      {error && <ErrorState message={error} onRetry={fetchChildMarks} />}

      {!loading && !error && data && (
        <>
          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Score</p>
                <h3 className="text-2xl font-extrabold text-primary-600 mt-1">{report.percentage}%</h3>
                <p className="text-xs text-slate-400 mt-0.5">Grade: {report.grade}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</p>
                <div className="mt-1">
                  <StatusBadge status={category} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highest Subject</p>
                <h3 className="text-sm font-bold text-emerald-600 mt-1">{report.highestSubject || 'N/A'}</h3>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lowest Subject</p>
                <h3 className="text-sm font-bold text-amber-600 mt-1">{report.lowestSubject || 'N/A'}</h3>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Subject Marks Breakdown</h3>
            <DataTable columns={columns} data={subjectMarks} emptyTitle="No exam marks published for child" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChildMarks;
