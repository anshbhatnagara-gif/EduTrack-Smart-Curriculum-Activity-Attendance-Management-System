import React, { useEffect, useState, useCallback } from 'react';
import { getMaterialsApi } from '../../api/material.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingTable from '../../components/feedback/LoadingTable';
import ErrorState from '../../components/feedback/ErrorState';
import { FileText, Download, ExternalLink, Search } from 'lucide-react';

const StudentMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMaterialsApi();
      if (res.success) {
        setMaterials(res.data || []);
      } else {
        setError(res.message || 'Failed to load materials.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials = materials.filter((m) => {
    const term = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(term) ||
      m.subject_name?.toLowerCase().includes(term) ||
      m.topic?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      header: 'Title & Topic',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs text-slate-500">{row.topic ? `Topic: ${row.topic}` : 'General Material'}</p>
        </div>
      )
    },
    { header: 'Subject', accessor: 'subject_name', render: (row) => <span className="font-semibold text-primary-700">{row.subject_name}</span> },
    { header: 'Teacher', accessor: 'teacher_name', render: (row) => row.teacher_name || 'Department' },
    { header: 'Type', accessor: 'file_type', render: (row) => <span className="uppercase text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{row.file_type || 'URL'}</span> },
    { header: 'Uploaded', accessor: 'created_at', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A' },
    {
      header: 'Access',
      accessor: 'id',
      render: (row) => {
        if (row.file_path) {
          return (
            <a
              href={`http://localhost:5000${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-primary-600 hover:text-primary-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          );
        }
        if (row.external_url) {
          return (
            <a
              href={row.external_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Link</span>
            </a>
          );
        }
        return <span className="text-xs text-slate-400">Unavailable</span>;
      }
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Study Materials" description="Course notes, lecture slides, and reference links" />
        <LoadingTable rows={6} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Study Materials" description="Course notes, lecture slides, and reference links" />
        <ErrorState message={error} onRetry={fetchMaterials} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Study Materials" description="Access lecture slides, reading materials, syllabus topics, and reference links" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, subject, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredMaterials} emptyTitle="No study materials published for your enrolled subjects" />
    </div>
  );
};

export default StudentMaterials;
