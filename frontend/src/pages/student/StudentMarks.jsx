import React, { useEffect, useState, useCallback } from 'react';
import { getMyMarksApi } from '../../api/marks.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, TrendingUp, AlertTriangle } from 'lucide-react';

const StudentMarks = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyMarksApi();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load marks.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marks & Academic Results" description="Recorded exam scores, subject grades, and overall performance index" />
        <LoadingTable rows={6} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marks & Academic Results" description="Recorded exam scores, subject grades, and overall performance index" />
        <ErrorState message={error} onRetry={fetchMarks} />
      </div>
    );
  }

  const report = data?.report || data;
  const subjectMarks = report?.subjectMarks || [];
  const category = report?.category || 'AVERAGE';

  const columns = [
    { header: 'Subject', accessor: 'subjectName', render: (row) => <span className="font-bold text-slate-900">{row.subjectName}</span> },
    { header: 'Subject Code', accessor: 'subjectCode', render: (row) => <span className="font-mono text-xs text-slate-500">{row.subjectCode}</span> },
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
      <PageHeader
        title="Marks & Academic Results"
        description="Recorded examination performance, score percentages, and grade calculations"
      />

      {/* Performance Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Percentage</p>
            <h3 className="text-2xl font-extrabold text-primary-600 mt-1">{report.percentage}%</h3>
            <p className="text-xs text-slate-400 mt-0.5">Grade: {report.grade}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Status</p>
            <div className="mt-1">
              <StatusBadge status={category} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Based on marks & attendance</p>
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

      {/* Subject Marks Table */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Award className="w-5 h-5 text-primary-600" />
          <span>Subject Marks Breakdown</span>
        </h3>
        <DataTable columns={columns} data={subjectMarks} emptyTitle="No exam marks published yet" />
      </div>
    </div>
  );
};

export default StudentMarks;
