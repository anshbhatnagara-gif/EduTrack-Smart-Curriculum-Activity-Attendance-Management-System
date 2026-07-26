import React, { useEffect, useState, useCallback } from 'react';
import {
  getClassesApi,
  createClassApi,
  updateClassApi,
  getSectionsApi,
  createSectionApi,
  updateSectionApi,
  getSessionsApi
} from '../../api/academic.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen, Grid, Plus, Edit, AlertCircle } from 'lucide-react';

const ClassesSections = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Class Form State
  const [classForm, setClassForm] = useState({ name: '', numericLevel: 1, academicSessionId: '', status: 'active' });
  // Section Form State
  const [sectionForm, setSectionForm] = useState({ classId: '', name: '', roomNumber: '', capacity: 40 });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [classRes, sessionRes] = await Promise.all([
        getClassesApi(),
        getSessionsApi()
      ]);

      if (classRes.success) setClasses(classRes.data || []);
      if (sessionRes.success) setSessions(sessionRes.data || []);

      const activeSess = sessionRes.data?.find(s => s.is_active);
      if (activeSess) {
        setClassForm(prev => ({ ...prev, academicSessionId: activeSess.id }));
      }
    } catch (err) {
      setError(err.message || 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchSectionsForClass = useCallback(async (classId) => {
    if (!classId) return;
    try {
      const res = await getSectionsApi({ classId });
      if (res.success) {
        setSections(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      fetchSectionsForClass(classes[0].id);
    }
  }, [classes, selectedClassId, fetchSectionsForClass]);

  const handleClassSelect = (classId) => {
    setSelectedClassId(classId);
    fetchSectionsForClass(classId);
  };

  const handleOpenClassAdd = () => {
    setSelectedClass(null);
    const activeSess = sessions.find(s => s.is_active);
    setClassForm({ name: '', numericLevel: 1, academicSessionId: activeSess ? activeSess.id : '', status: 'active' });
    setFormError('');
    setIsClassModalOpen(true);
  };

  const handleOpenClassEdit = (cls) => {
    setSelectedClass(cls);
    setClassForm({
      name: cls.name || '',
      numericLevel: cls.numeric_level || 1,
      academicSessionId: cls.academic_session_id || '',
      status: cls.status || 'active'
    });
    setFormError('');
    setIsClassModalOpen(true);
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!classForm.name || !classForm.academicSessionId) {
      setFormError('Class name and academic session are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedClass) {
        await updateClassApi(selectedClass.id, classForm);
      } else {
        await createClassApi(classForm);
      }
      setIsClassModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to save class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSectionAdd = () => {
    setSelectedSection(null);
    setSectionForm({ classId: selectedClassId, name: '', roomNumber: '', capacity: 40 });
    setFormError('');
    setIsSectionModalOpen(true);
  };

  const handleOpenSectionEdit = (sec) => {
    setSelectedSection(sec);
    setSectionForm({
      classId: sec.class_id || selectedClassId,
      name: sec.name || '',
      roomNumber: sec.room_number || '',
      capacity: sec.capacity || 40
    });
    setFormError('');
    setIsSectionModalOpen(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!sectionForm.name || !sectionForm.classId) {
      setFormError('Section name and Class are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedSection) {
        await updateSectionApi(selectedSection.id, sectionForm);
      } else {
        await createSectionApi(sectionForm);
      }
      setIsSectionModalOpen(false);
      fetchSectionsForClass(selectedClassId);
    } catch (err) {
      setFormError(err.message || 'Failed to save section.');
    } finally {
      setSubmitting(false);
    }
  };

  const classColumns = [
    { header: 'Class Name', accessor: 'name', render: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { header: 'Level', accessor: 'numeric_level' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleClassSelect(row.id)} className={`px-2.5 py-1 text-xs font-semibold rounded-md ${selectedClassId === row.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            View Sections
          </button>
          <button onClick={() => handleOpenClassEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const sectionColumns = [
    { header: 'Section Name', accessor: 'name', render: (row) => <span className="font-bold text-slate-900">{row.name}</span> },
    { header: 'Room Number', accessor: 'room_number', render: (row) => row.room_number || 'N/A' },
    { header: 'Student Capacity', accessor: 'capacity' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button onClick={() => handleOpenSectionEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50">
          <Edit className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes & Sections"
        description="Structure school grade levels, class sections, room numbers, and capacity limits"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <span>Classes</span>
            </h3>
            <button onClick={handleOpenClassAdd} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700">
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>
          <DataTable columns={classColumns} data={classes} isLoading={loading} error={error} onRetry={fetchData} />
        </div>

        {/* Sections Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Grid className="w-5 h-5 text-indigo-600" />
              <span>Sections for Class</span>
            </h3>
            <button onClick={handleOpenSectionAdd} disabled={!selectedClassId} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50">
              <Plus className="w-4 h-4" />
              <span>Add Section</span>
            </button>
          </div>
          <DataTable columns={sectionColumns} data={sections} isLoading={loading} emptyTitle="Select a class to view sections" />
        </div>
      </div>

      {/* Class Modal */}
      <FormModal isOpen={isClassModalOpen} title={selectedClass ? 'Edit Class' : 'Add New Class'} onClose={() => setIsClassModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleClassSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Class Name *</label>
            <input type="text" required value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g. Grade 9" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Numeric Level *</label>
              <input type="number" min="1" max="12" required value={classForm.numericLevel} onChange={(e) => setClassForm({ ...classForm, numericLevel: parseInt(e.target.value, 10) })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Academic Session *</label>
              <select required value={classForm.academicSessionId} onChange={(e) => setClassForm({ ...classForm, academicSessionId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="">-- Choose Session --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Class</button>
          </div>
        </form>
      </FormModal>

      {/* Section Modal */}
      <FormModal isOpen={isSectionModalOpen} title={selectedSection ? 'Edit Section' : 'Add New Section'} onClose={() => setIsSectionModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSectionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Target Class *</label>
            <select required value={sectionForm.classId} onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Section Name *</label>
              <input type="text" required value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="e.g. A" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Room Number</label>
              <input type="text" value={sectionForm.roomNumber} onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })} placeholder="e.g. Room 101" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Capacity</label>
              <input type="number" value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value, 10) })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">Save Section</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default ClassesSections;
