import React, { useEffect, useState, useCallback } from 'react';
import { getSessionsApi, createSessionApi, updateSessionApi } from '../../api/academic.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarPlus, Edit, AlertCircle } from 'lucide-react';

const AcademicSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSessionsApi();
      if (res.success) {
        setSessions(res.data || []);
      } else {
        setError(res.message || 'Failed to load academic sessions.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleOpenAdd = () => {
    setSelectedSession(null);
    setFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (session) => {
    setSelectedSession(session);
    setFormData({
      name: session.name || '',
      startDate: session.start_date ? new Date(session.start_date).toISOString().split('T')[0] : '',
      endDate: session.end_date ? new Date(session.end_date).toISOString().split('T')[0] : '',
      isActive: !!session.is_active
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setFormError('All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedSession) {
        await updateSessionApi(selectedSession.id, formData);
      } else {
        await createSessionApi(formData);
      }
      setIsModalOpen(false);
      fetchSessions();
    } catch (err) {
      setFormError(err.message || 'Failed to save session.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Session Name', accessor: 'name', render: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { header: 'Start Date', accessor: 'start_date', render: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString() : 'N/A' },
    { header: 'End Date', accessor: 'end_date', render: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString() : 'N/A' },
    { header: 'Status', accessor: 'is_active', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Edit Session">
          <Edit className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Sessions"
        description="Manage school academic years and active session flags"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <CalendarPlus className="w-4 h-4" />
            <span>Add Academic Session</span>
          </button>
        }
      />

      <DataTable columns={columns} data={sessions} isLoading={loading} error={error} onRetry={fetchSessions} />

      <FormModal isOpen={isModalOpen} title={selectedSession ? 'Edit Academic Session' : 'Add Academic Session'} onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Session Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 2026-2027" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Start Date *</label>
              <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">End Date *</label>
              <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="flex items-center pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-slate-300 text-primary-600" />
              <span>Set as Active Academic Session</span>
            </label>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Session</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default AcademicSessions;
