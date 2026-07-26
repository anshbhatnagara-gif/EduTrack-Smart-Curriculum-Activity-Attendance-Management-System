import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAssignmentsApi,
  createAssignmentApi,
  updateAssignmentApi,
  deleteAssignmentApi
} from '../../api/assignment.api';
import { getTeacherClassesApi } from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, FileCheck, FileText, AlertCircle } from 'lucide-react';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [classesOptions, setClassesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [formData, setFormData] = useState({
    assignmentKey: '',
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    attachment: null
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

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAssignmentsApi();
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

  useEffect(() => {
    fetchOptions();
    fetchAssignments();
  }, [fetchOptions, fetchAssignments]);

  const handleOpenAdd = () => {
    setSelectedAssignment(null);
    setFormData({
      assignmentKey: classesOptions.length > 0 ? `${classesOptions[0].class_id}_${classesOptions[0].section_id}_${classesOptions[0].subject_id}` : '',
      title: '',
      description: '',
      dueDate: '',
      maxMarks: 100,
      attachment: null
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (assign) => {
    setSelectedAssignment(assign);
    setFormData({
      assignmentKey: `${assign.class_id}_${assign.section_id}_${assign.subject_id}`,
      title: assign.title || '',
      description: assign.description || '',
      dueDate: assign.due_date ? new Date(assign.due_date).toISOString().split('T')[0] : '',
      maxMarks: assign.max_marks || 100,
      attachment: null
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.assignmentKey || !formData.title || !formData.dueDate || !formData.maxMarks) {
      setFormError('Class selection, Title, Due Date, and Maximum Marks are required.');
      return;
    }

    const [classId, sectionId, subjectId] = formData.assignmentKey.split('_');

    const body = new FormData();
    body.append('classId', classId);
    body.append('sectionId', sectionId);
    body.append('subjectId', subjectId);
    body.append('title', formData.title);
    body.append('description', formData.description);
    body.append('dueDate', formData.dueDate);
    body.append('maxMarks', formData.maxMarks);

    if (formData.attachment) {
      body.append('attachment', formData.attachment);
    }

    try {
      setSubmitting(true);
      if (selectedAssignment) {
        await updateAssignmentApi(selectedAssignment.id, body);
      } else {
        await createAssignmentApi(body);
      }
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err) {
      setFormError(err.message || 'Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const res = await deleteAssignmentApi(selectedAssignment.id);
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
    {
      header: 'Assignment Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs text-slate-400">Max Marks: {row.max_marks}</p>
        </div>
      )
    },
    { header: 'Class / Subject', accessor: 'class_name', render: (row) => `${row.class_name} - ${row.section_name} (${row.subject_name})` },
    { header: 'Due Date', accessor: 'due_date', render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A' },
    {
      header: 'Submissions',
      accessor: 'submissions_count',
      render: (row) => (
        <button
          onClick={() => navigate(`/teacher/submissions?assignmentId=${row.id}`)}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1.5 text-xs font-semibold"
        >
          <FileCheck className="w-4 h-4" />
          <span>View Submissions ({row.submissions_count ?? 0})</span>
        </button>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedAssignment(row); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments Management"
        description="Publish homework tasks, set due dates, maximum marks, and evaluate student work"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        }
      />

      <DataTable columns={columns} data={assignments} isLoading={loading} error={error} onRetry={fetchAssignments} />

      <FormModal isOpen={isModalOpen} title={selectedAssignment ? 'Edit Assignment' : 'Create Assignment'} onClose={() => setIsModalOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Target Class & Subject *</label>
            <select
              value={formData.assignmentKey}
              onChange={(e) => setFormData({ ...formData, assignmentKey: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {classesOptions.map((a) => (
                <option key={`${a.class_id}_${a.section_id}_${a.subject_id}`} value={`${a.class_id}_${a.section_id}_${a.subject_id}`}>
                  {a.class_name} - {a.section_name} | {a.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Title *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Calculus Homework 1" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Due Date *</label>
              <input type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Maximum Marks *</label>
              <input type="number" min="1" max="1000" required value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value, 10) })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description & Instructions</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Submission guidelines..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Optional File Attachment</label>
            <input type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })} className="w-full text-xs text-slate-600 border rounded-lg p-2" />
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Assignment</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Assignment"
        message={`Are you sure you want to delete assignment "${selectedAssignment?.title}"?`}
        confirmText="Delete Assignment"
        isDanger={true}
        isLoading={submitting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default TeacherAssignments;
