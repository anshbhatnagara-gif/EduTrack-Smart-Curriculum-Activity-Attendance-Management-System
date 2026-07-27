import React, { useEffect, useState, useCallback } from 'react';
import {
  getAnnouncementsApi,
  createAnnouncementApi,
  updateAnnouncementApi,
  deleteAnnouncementApi
} from '../../api/announcement.api';
import { getClassesApi, getSectionsApi } from '../../api/academic.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Megaphone, Plus, Edit, Trash2, AlertCircle, Filter } from 'lucide-react';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'active', 'expired'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetRole: 'all',
    classId: '',
    sectionId: '',
    publishAt: '',
    expiresAt: ''
  });
  const [formSections, setFormSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLookups = useCallback(async () => {
    try {
      const classRes = await getClassesApi();
      if (classRes.success) setClasses(classRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnnouncementsApi();
      if (res.success) {
        setAnnouncements(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
    fetchData();
  }, [fetchLookups, fetchData]);

  const handleFormClassChange = async (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, classId: val, sectionId: '' }));
    if (!val) {
      setFormSections([]);
      return;
    }
    try {
      const res = await getSectionsApi({ classId: val });
      if (res.success) setFormSections(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setSelectedAnnouncement(null);
    setForm({
      title: '',
      content: '',
      priority: 'normal',
      targetRole: 'all',
      classId: '',
      sectionId: '',
      publishAt: '',
      expiresAt: ''
    });
    setFormSections([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (ann) => {
    setSelectedAnnouncement(ann);
    setForm({
      title: ann.title || '',
      content: ann.content || '',
      priority: ann.priority || 'normal',
      targetRole: ann.target_role || 'all',
      classId: ann.class_id || '',
      sectionId: ann.section_id || '',
      publishAt: ann.publish_at ? ann.publish_at.split('T')[0] : '',
      expiresAt: ann.expires_at ? ann.expires_at.split('T')[0] : ''
    });
    setFormError('');
    
    if (ann.class_id) {
      try {
        const res = await getSectionsApi({ classId: ann.class_id });
        if (res.success) setFormSections(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      setSubmitting(true);
      const data = { ...form };
      if (!data.classId) data.classId = null;
      if (!data.sectionId) data.sectionId = null;
      if (!data.publishAt) data.publishAt = null;
      if (!data.expiresAt) data.expiresAt = null;

      if (selectedAnnouncement) {
        await updateAnnouncementApi(selectedAnnouncement.id, data);
      } else {
        await createAnnouncementApi(data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    try {
      setSubmitting(true);
      await deleteAnnouncementApi(selectedAnnouncement.id);
      setIsConfirmOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Data Client-side
  const filteredData = announcements.filter(a => {
    if (filterPriority && a.priority !== filterPriority) return false;
    if (filterRole && a.target_role !== filterRole) return false;
    if (filterStatus) {
      const isExpired = a.expires_at && new Date(a.expires_at) <= new Date();
      if (filterStatus === 'active' && isExpired) return false;
      if (filterStatus === 'expired' && !isExpired) return false;
    }
    return true;
  });

  const columns = [
    { 
      header: 'Title', 
      accessor: 'title',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.title}</div>
          <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.content}</div>
        </div>
      )
    },
    { 
      header: 'Target Role', 
      accessor: 'target_role',
      render: (row) => (
        <span className="capitalize px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
          {row.target_role}
        </span>
      )
    },
    { 
      header: 'Priority', 
      accessor: 'priority',
      render: (row) => (
        <span className={`capitalize px-2 py-1 rounded-md text-xs font-medium ${
          row.priority === 'high' ? 'bg-rose-100 text-rose-700' :
          row.priority === 'urgent' ? 'bg-red-100 text-red-700 font-bold' :
          'bg-blue-100 text-blue-700'
        }`}>
          {row.priority}
        </span>
      )
    },
    { 
      header: 'Expires At', 
      accessor: 'expires_at',
      render: (row) => {
        if (!row.expires_at) return <span className="text-slate-400 text-xs">Never</span>;
        const isExpired = new Date(row.expires_at) <= new Date();
        return (
          <div className={`text-sm ${isExpired ? 'text-rose-500 font-medium' : 'text-slate-700'}`}>
            {new Date(row.expires_at).toLocaleDateString()}
            {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedAnnouncement(row); setIsConfirmOpen(true); }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Manage school-wide and class-specific announcements"
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Roles</option>
            <option value="all">Everyone</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button onClick={handleOpenAdd} className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filteredData} isLoading={loading} error={error} onRetry={fetchData} emptyTitle="No announcements found" />
      </div>

      <FormModal isOpen={isModalOpen} title={selectedAnnouncement ? 'Edit Announcement' : 'New Announcement'} onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Content *</label>
            <textarea required rows="4" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role *</label>
              <select required value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="all">Everyone</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
                <option value="parent">Parents</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority *</label>
              <select required value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            {/* Target Class / Section based on role */}
            {['all', 'student', 'parent'].includes(form.targetRole) && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class (Optional)</label>
                  <select value={form.classId} onChange={handleFormClassChange} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section (Optional)</label>
                  <select value={form.sectionId} onChange={e => setForm({...form, sectionId: e.target.value})} disabled={!form.classId} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="">All Sections</option>
                    {formSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Publish At (Optional)</label>
              <input type="date" value={form.publishAt} onChange={e => setForm({...form, publishAt: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expires At (Optional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action is permanent."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        isDestructive={true}
      />
    </div>
  );
};

export default AdminAnnouncements;
