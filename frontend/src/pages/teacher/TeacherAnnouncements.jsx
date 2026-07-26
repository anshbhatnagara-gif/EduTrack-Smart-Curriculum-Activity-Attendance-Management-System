import React, { useEffect, useState, useCallback } from 'react';
import { getAnnouncementsApi, createAnnouncementApi } from '../../api/announcement.api';
import { getTeacherClassesApi } from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import { Megaphone, Plus, AlertCircle } from 'lucide-react';

const TeacherAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [classesOptions, setClassesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetKey: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchOptions = useCallback(async () => {
    try {
      const res = await getTeacherClassesApi();
      if (res.success) {
        setClassesOptions(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnnouncementsApi();
      if (res.success) {
        setAnnouncements(res.data || []);
      } else {
        setError(res.message || 'Failed to load announcements.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchAnnouncements();
  }, [fetchOptions, fetchAnnouncements]);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      message: '',
      targetKey: classesOptions.length > 0 ? `${classesOptions[0].class_id}_${classesOptions[0].section_id}` : ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.message || !formData.targetKey) {
      setFormError('Title, message, and target class are required.');
      return;
    }

    const [classId, sectionId] = formData.targetKey.split('_');

    const payload = {
      title: formData.title,
      message: formData.message,
      targetRole: 'class',
      targetClassId: parseInt(classId, 10),
      targetSectionId: parseInt(sectionId, 10)
    };

    try {
      setSubmitting(true);
      const res = await createAnnouncementApi(payload);
      if (res.success) {
        setIsModalOpen(false);
        fetchAnnouncements();
      } else {
        setFormError(res.message || 'Failed to post announcement.');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Title & Notice',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{row.message}</p>
        </div>
      )
    },
    {
      header: 'Audience / Target',
      accessor: 'target_role',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
          {row.target_class_name ? `${row.target_class_name} - ${row.target_section_name || ''}` : row.target_role || 'All'}
        </span>
      )
    },
    { header: 'Posted Date', accessor: 'created_at', render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classroom Announcements"
        description="Broadcast notices and important exam updates to students in your assigned classes"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        }
      />

      <DataTable columns={columns} data={announcements} isLoading={loading} error={error} onRetry={fetchAnnouncements} />

      <FormModal isOpen={isModalOpen} title="Broadcast New Announcement" onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Target Assigned Class *</label>
            <select
              value={formData.targetKey}
              onChange={(e) => setFormData({ ...formData, targetKey: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {classesOptions.map((a) => (
                <option key={`${a.class_id}_${a.section_id}`} value={`${a.class_id}_${a.section_id}`}>
                  {a.class_name} - {a.section_name} ({a.subject_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Midterm Revision Session Details"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Message Content *</label>
            <textarea
              required
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Detailed announcement text..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Post Announcement</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default TeacherAnnouncements;
