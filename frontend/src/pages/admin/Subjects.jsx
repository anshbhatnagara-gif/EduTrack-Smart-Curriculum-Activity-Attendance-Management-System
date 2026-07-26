import React, { useEffect, useState, useCallback } from 'react';
import { getSubjectsApi, createSubjectApi, updateSubjectApi } from '../../api/academic.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import SearchInput from '../../components/common/SearchInput';
import { BookMarked, Plus, Edit, AlertCircle } from 'lucide-react';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({ subjectCode: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSubjectsApi();
      if (res.success) {
        setSubjects(res.data || []);
      } else {
        setError(res.message || 'Failed to load subjects.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenAdd = () => {
    setSelectedSubject(null);
    setFormData({ subjectCode: '', name: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setSelectedSubject(sub);
    setFormData({
      subjectCode: sub.subject_code || '',
      name: sub.name || '',
      description: sub.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.subjectCode || !formData.name) {
      setFormError('Subject code and Subject name are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedSubject) {
        await updateSubjectApi(selectedSubject.id, formData);
      } else {
        await createSubjectApi(formData);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setFormError(err.message || 'Failed to save subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.subject_code?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Subject Code', accessor: 'subject_code', render: (row) => <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-800">{row.subject_code}</span> },
    { header: 'Subject Name', accessor: 'name', render: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { header: 'Description', accessor: 'description', render: (row) => row.description || 'N/A' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Edit Subject">
          <Edit className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects Catalog"
        description="Configure academic subjects and course codes"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        }
      />

      <div className="flex justify-between items-center">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search subject name or code..." />
      </div>

      <DataTable columns={columns} data={filtered} isLoading={loading} error={error} onRetry={fetchSubjects} />

      <FormModal isOpen={isModalOpen} title={selectedSubject ? 'Edit Subject' : 'Add New Subject'} onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Subject Code *</label>
              <input type="text" required value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} placeholder="e.g. MATH101" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Subject Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mathematics" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Course outline..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Subject</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default Subjects;
