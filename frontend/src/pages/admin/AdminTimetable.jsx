import React, { useEffect, useState, useCallback } from 'react';
import {
  getTimetableApi,
  createTimetableEntryApi,
  updateTimetableEntryApi,
  deleteTimetableEntryApi
} from '../../api/timetable.api';
import {
  getSessionsApi,
  getClassesApi,
  getSectionsApi,
  getSubjectsApi
} from '../../api/academic.api';
import { getTeachersApi } from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Clock, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

const AdminTimetable = () => {
  const [timetable, setTimetable] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  
  // Lookups
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [form, setForm] = useState({
    academicSessionId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    roomNumber: ''
  });
  const [formSections, setFormSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchLookups = useCallback(async () => {
    try {
      const [sessRes, classRes, subRes, teachRes] = await Promise.all([
        getSessionsApi(),
        getClassesApi(),
        getSubjectsApi(),
        getTeachersApi({ limit: 1000 })
      ]);
      if (sessRes.success) setSessions(sessRes.data || []);
      if (classRes.success) setClasses(classRes.data || []);
      if (subRes.success) setSubjects(subRes.data || []);
      if (teachRes.success) setTeachers(teachRes.data || []);
    } catch (err) {
      console.error('Failed to load lookups', err);
    }
  }, []);

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterClass) params.classId = filterClass;
      if (filterSection) params.sectionId = filterSection;
      if (filterTeacher) params.teacherId = filterTeacher;

      const res = await getTimetableApi(params);
      if (res.success) {
        setTimetable(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterSection, filterTeacher]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const fetchSectionsForFilter = async (classId) => {
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const res = await getSectionsApi({ classId });
      if (res.success) setSections(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterClassChange = (e) => {
    const val = e.target.value;
    setFilterClass(val);
    setFilterSection('');
    fetchSectionsForFilter(val);
  };

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
    setSelectedEntry(null);
    const activeSess = sessions.find(s => s.is_active);
    setForm({
      academicSessionId: activeSess ? activeSess.id : '',
      classId: '',
      sectionId: '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 'Monday',
      startTime: '',
      endTime: '',
      roomNumber: ''
    });
    setFormSections([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (entry) => {
    setSelectedEntry(entry);
    setForm({
      academicSessionId: entry.academic_session_id || '',
      classId: entry.class_id || '',
      sectionId: entry.section_id || '',
      subjectId: entry.subject_id || '',
      teacherId: entry.teacher_id || '',
      dayOfWeek: entry.day_of_week || 'Monday',
      startTime: entry.start_time || '',
      endTime: entry.end_time || '',
      roomNumber: entry.room_number || ''
    });
    setFormError('');
    
    // Fetch sections for this class
    if (entry.class_id) {
      try {
        const res = await getSectionsApi({ classId: entry.class_id });
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
    
    if (form.startTime >= form.endTime) {
      setFormError('End time must be after start time.');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedEntry) {
        await updateTimetableEntryApi(selectedEntry.id, form);
      } else {
        await createTimetableEntryApi(form);
      }
      setIsModalOpen(false);
      fetchTimetable();
    } catch (err) {
      setFormError(err.message || 'Failed to save timetable entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      setSubmitting(true);
      await deleteTimetableEntryApi(selectedEntry.id);
      setIsConfirmOpen(false);
      fetchTimetable();
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    } finally {
      setSubmitting(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Management"
        description="Schedule classes, manage rooms, and view teacher timetables"
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Class Filter</label>
          <select value={filterClass} onChange={handleFilterClassChange} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Section Filter</label>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} disabled={!filterClass} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teacher Filter</label>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button onClick={handleOpenAdd} className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          <p className="font-semibold text-lg flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-slate-500">Loading timetable...</div>
      ) : (
        <div className="space-y-8">
          {days.map(day => (
            timetable[day] && timetable[day].length > 0 && (
              <div key={day} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-800 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary-600" />
                  {day}
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Class & Section</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Subject</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Teacher</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Room</th>
                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetable[day].map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                            {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                          </td>
                          <td className="p-3 text-sm text-slate-700">{entry.class_name} ({entry.section_name})</td>
                          <td className="p-3 text-sm text-slate-700">{entry.subject_name}</td>
                          <td className="p-3 text-sm text-slate-700">{entry.teacher_name}</td>
                          <td className="p-3 text-sm text-slate-700">{entry.room_number}</td>
                          <td className="p-3 text-sm text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => handleOpenEdit(entry)} className="p-1 text-primary-600 hover:bg-primary-50 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEntry(entry); setIsConfirmOpen(true); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {timetable[day].map(entry => (
                    <div key={entry.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-900 text-sm">
                          {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                        </span>
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenEdit(entry)} className="p-1.5 text-primary-600 bg-primary-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedEntry(entry); setIsConfirmOpen(true); }} className="p-1.5 text-rose-600 bg-rose-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-700"><span className="font-medium">Class:</span> {entry.class_name} ({entry.section_name})</div>
                      <div className="text-sm text-slate-700"><span className="font-medium">Subject:</span> {entry.subject_name}</div>
                      <div className="text-sm text-slate-700"><span className="font-medium">Teacher:</span> {entry.teacher_name}</div>
                      <div className="text-sm text-slate-700"><span className="font-medium">Room:</span> {entry.room_number}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {Object.values(timetable).every(arr => arr.length === 0) && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">No timetable entries found for the selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <FormModal isOpen={isModalOpen} title={selectedEntry ? 'Edit Entry' : 'Add Entry'} onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Session *</label>
              <select required value={form.academicSessionId} onChange={e => setForm({...form, academicSessionId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week *</label>
              <select required value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
              <select required value={form.classId} onChange={handleFormClassChange} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
              <select required value={form.sectionId} onChange={e => setForm({...form, sectionId: e.target.value})} disabled={!form.classId} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Section</option>
                {formSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
              <select required value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher *</label>
              <select required value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
              <input type="text" required value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} placeholder="e.g. Room 101" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Timetable Entry"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        isDestructive={true}
      />
    </div>
  );
};

export default AdminTimetable;
