import React, { useEffect, useState, useCallback } from 'react';
import {
  getStudentEnrollmentsApi,
  enrollStudentApi,
  updateEnrollmentStatusApi,
  getClassesApi,
  getSectionsApi,
  getSessionsApi
} from '../../api/academic.api';
import { getStudentsApi } from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import FilterBar from '../../components/common/FilterBar';
import { UserPlus, Edit, AlertCircle } from 'lucide-react';

const StudentEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const [form, setForm] = useState({
    studentId: '',
    classId: '',
    sectionId: '',
    academicSessionId: '',
    rollNumber: '',
    enrollmentStatus: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentEnrollmentsApi({
        classId: classFilter,
        sectionId: sectionFilter
      });
      if (res.success) {
        setEnrollments(res.data || []);
      } else {
        setError(res.message || 'Failed to load enrollments.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, [classFilter, sectionFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const [sRes, cRes, sessRes] = await Promise.all([
        getStudentsApi({ limit: 100 }),
        getClassesApi(),
        getSessionsApi()
      ]);
      if (sRes.success) setStudents(sRes.data || []);
      if (cRes.success) setClasses(cRes.data || []);
      if (sessRes.success) {
        setSessions(sessRes.data || []);
        const active = sessRes.data?.find(s => s.is_active);
        if (active) setForm(prev => ({ ...prev, academicSessionId: active.id }));
      }
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchOptions();
  }, [fetchEnrollments, fetchOptions]);

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

    if (!form.studentId || !form.classId || !form.sectionId || !form.academicSessionId || !form.rollNumber) {
      setFormError('All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await enrollStudentApi({
        studentId: parseInt(form.studentId, 10),
        classId: parseInt(form.classId, 10),
        sectionId: parseInt(form.sectionId, 10),
        academicSessionId: parseInt(form.academicSessionId, 10),
        rollNumber: form.rollNumber,
        enrollmentStatus: form.enrollmentStatus
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchEnrollments();
      } else {
        setFormError(res.message || 'Enrollment failed.');
      }
    } catch (err) {
      setFormError(err.message || 'Error executing enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setSubmitting(true);
      const res = await updateEnrollmentStatusApi(selectedEnrollment.id, { enrollmentStatus: newStatus });
      if (res.success) {
        setIsStatusOpen(false);
        fetchEnrollments();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Student Name', accessor: 'student_name', render: (row) => <span className="font-bold text-slate-900">{row.student_name}</span> },
    { header: 'Admission No', accessor: 'admission_number' },
    { header: 'Roll Number', accessor: 'roll_number', render: (row) => <span className="font-semibold text-slate-700">{row.roll_number}</span> },
    { header: 'Class / Section', accessor: 'class_name', render: (row) => `${row.class_name} - ${row.section_name}` },
    { header: 'Status', accessor: 'enrollment_status', render: (row) => <StatusBadge status={row.enrollment_status} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button onClick={() => { setSelectedEnrollment(row); setIsStatusOpen(true); }} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Update Status">
          <Edit className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Enrollments"
        description="Enroll students into active classes, assign roll numbers, and update course statuses"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>
        }
      />

      <FilterBar
        filters={[
          {
            key: 'classId',
            value: classFilter,
            options: [{ label: 'All Classes', value: '' }, ...classes.map(c => ({ label: c.name, value: c.id }))]
          }
        ]}
        onChange={(k, v) => setClassFilter(v)}
      />

      <DataTable columns={columns} data={enrollments} isLoading={loading} error={error} onRetry={fetchEnrollments} />

      <FormModal isOpen={isModalOpen} title="Enroll Student in Class" onClose={() => setIsModalOpen(false)}>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Student *</label>
            <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">-- Select Student --</option>
              {students.map(s => <option key={s.student_id || s.id} value={s.student_id || s.id}>{s.full_name} ({s.admission_number})</option>)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Roll Number *</label>
              <input type="text" required value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} placeholder="e.g. 101" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Status</label>
              <select value={form.enrollmentStatus} onChange={(e) => setForm({ ...form, enrollmentStatus: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Submit Enrollment</button>
          </div>
        </form>
      </FormModal>

      {/* Edit Status Modal */}
      <FormModal isOpen={isStatusOpen} title="Update Enrollment Status" onClose={() => setIsStatusOpen(false)}>
        {selectedEnrollment && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Select new enrollment status for <span className="font-bold">{selectedEnrollment.student_name}</span>:</p>
            <div className="flex space-x-3">
              {['active', 'completed', 'dropped'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusUpdate(st)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${selectedEnrollment.enrollment_status === st ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default StudentEnrollments;
