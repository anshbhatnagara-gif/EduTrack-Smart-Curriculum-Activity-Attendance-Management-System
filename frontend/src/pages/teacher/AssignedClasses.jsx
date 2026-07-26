import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherClassesApi } from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import { CheckSquare, FileText, ClipboardCheck, Award } from 'lucide-react';

const AssignedClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchAssignedClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherClassesApi();
      if (res.success) {
        setClasses(res.data || []);
      } else {
        setError(res.message || 'Failed to load assigned classes.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedClasses();
  }, [fetchAssignedClasses]);

  const filtered = classes.filter((c) =>
    c.class_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.section_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject_name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Class & Section',
      accessor: 'class_name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.class_name} - {row.section_name}</span>
          <p className="text-xs text-slate-400">Session: {row.session_name || 'Current'}</p>
        </div>
      )
    },
    {
      header: 'Assigned Subject',
      accessor: 'subject_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-primary-700">{row.subject_name}</span>
          <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{row.subject_code}</span>
        </div>
      )
    },
    { header: 'Enrolled Students', accessor: 'student_count', render: (row) => <span className="font-bold text-slate-800">{row.student_count ?? 0}</span> },
    {
      header: 'Quick Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/teacher/attendance/mark?classId=${row.class_id}&sectionId=${row.section_id}&subjectId=${row.subject_id}`)}
            className="p-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center space-x-1 text-xs font-semibold"
            title="Mark Attendance"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Attendance</span>
          </button>
          <button
            onClick={() => navigate(`/teacher/materials?classId=${row.class_id}&subjectId=${row.subject_id}`)}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1 text-xs font-semibold"
            title="Materials"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Materials</span>
          </button>
          <button
            onClick={() => navigate(`/teacher/assignments?classId=${row.class_id}&subjectId=${row.subject_id}`)}
            className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center space-x-1 text-xs font-semibold"
            title="Assignments"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Assignments</span>
          </button>
          <button
            onClick={() => navigate(`/teacher/marks?classId=${row.class_id}&subjectId=${row.subject_id}`)}
            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center space-x-1 text-xs font-semibold"
            title="Marks Entry"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Marks</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Classes"
        description="View your assigned teaching subjects, section rosters, and launch classroom tasks"
      />

      <div className="flex justify-between items-center">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search assigned class or subject..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        error={error}
        onRetry={fetchAssignedClasses}
        emptyTitle="No assigned classes found"
        emptyDescription="You currently do not have any teaching assignments assigned."
      />
    </div>
  );
};

export default AssignedClasses;
