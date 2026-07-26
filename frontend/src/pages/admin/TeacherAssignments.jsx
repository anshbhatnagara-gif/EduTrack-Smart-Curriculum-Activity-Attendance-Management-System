import React, { useEffect, useState, useCallback } from 'react';
import {
  getTeacherAssignmentsAdminApi,
  assignTeacherApi,
  removeTeacherAssignmentApi,
  getClassesApi,
  getSectionsApi,
  getSubjectsApi,
  getSessionsApi
} from '../../api/academic.api';
import { getTeachersApi } from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [form, setForm] = useState({
    teacherId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    academicSessionId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherAssignmentsAdminApi();
      if (res.success) {
        setAssignments(res.data || []);
      } else {
        setError(res.message || 'Failed to load assignments.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [tRes, cRes, subRes, sRes] = await Promise.all([
        getTeachersApi({ limit: 100 }),
        getClassesApi(),
        getSubjectsApi(),
        getSessionsApi()
      ]);
      if (tRes.success) setTeachers(tRes.data || []);
      if (cRes.success) setClasses(cRes.data || []);
      if (subRes.success) setSubjects(subRes.data || []);
      if (sRes.success) {
        setSessions(sRes.data || []);
        const active = sRes.data?.find(s => s.is_active);
        if (active) setForm(prev => ({ ...prev, academicSessionId: active.id }));
      }
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchOptions();
  }, [fetchAssignments, fetchOptions]);

  const handleClassChange = async (classId) => {
    setForm(prev => ({ ...prev, classId, sectionId: '' }));
    if (!classId) return;
    try {
      const res = await getSectionsApi({ classId });
      if (res.success) setSections(res.data || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleOpenAdd = () => {
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.teacherId || !form.classId || !form.sectionId || !form.subjectId || !form.academicSessionId) {
      setFormError('All selection fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await assignTeacherApi({
        teacherId: parseInt(form.teacherId, 10),
        classId: parseInt(form.classId, 10),
        sectionId: parseInt(form.sectionId, 10),
        subjectId: parseInt(form.subjectId, 10),
        academicSessionId: parseInt(form.academicSessionId, 10)
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchAssignments();
      } else {
        setFormError(res.message || 'Assignment failed.');
      }
    } catch (err) {
      setFormError(err.message || 'Duplicate assignment error or failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const res = await removeTeacherAssignmentApi(selectedAssignment.assignment_id || selectedAssignment.id);
      if (res.success) {
        setIsDeleteOpen(false);
        fetchAssignments();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Teacher', accessor: 'teacher_name', render: (row) => <span className="font-bold text-slate-900">{row.teacher_name}</span> },
    { header: 'Class / Section', accessor: 'class_name', render: (row) => `${row.class_name} - ${row.section_name}` },
    { header: 'Subject', accessor: 'subject_name', render: (row) => <span className="font-semibold text-primary-700">{row.subject_name}</span> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button onClick={() => { setSelectedAssignment(row); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" title="Remove Assignment">
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to class sections and course subjects"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>Assign Teacher</span>
          </button>
        }
      />

      <DataTable columns={columns} data={assignments} isLoading={loading} error={error} onRetry={fetchAssignments} />

      <FormModal isOpen={isModalOpen} title="Assign Teacher to Subject" onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Academic Session *</label>
            <select required value={form.academicSessionId} onChange={(e) => setForm({ ...form, academicSessionId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">-- Select Session --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Teacher *</label>
            <select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">-- Select Teacher --</option>
              {teachers.map(t => <option key={t.teacher_id || t.id} value={t.teacher_id || t.id}>{t.full_name} ({t.employee_code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Class *</label>
              <select required value={form.classId} onChange={(e) => handleClassChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Section *</label>
              <select required value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="">-- Select Section --</option>
                {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Subject *</label>
            <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">-- Select Subject --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.subject_code})</option>)}
            </select>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Submit Assignment</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Remove Teacher Assignment"
        message={`Are you sure you want to remove ${selectedAssignment?.teacher_name} from teaching ${selectedAssignment?.subject_name}?`}
        confirmText="Remove Assignment"
        isDanger={true}
        isLoading={submitting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default TeacherAssignments;
