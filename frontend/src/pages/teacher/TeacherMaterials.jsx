import React, { useEffect, useState, useCallback } from 'react';
import {
  getMaterialsApi,
  uploadMaterialApi,
  updateMaterialApi,
  deleteMaterialApi
} from '../../api/material.api';
import { getTeacherClassesApi } from '../../api/attendance.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, ExternalLink, FileText, AlertCircle } from 'lucide-react';

const TeacherMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [classesOptions, setClassesOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [formData, setFormData] = useState({
    assignmentKey: '',
    title: '',
    description: '',
    unitName: '',
    topicName: '',
    materialType: 'file',
    externalUrl: '',
    file: null
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

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMaterialsApi();
      if (res.success) {
        setMaterials(res.data || []);
      } else {
        setError(res.message || 'Failed to load study materials.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchMaterials();
  }, [fetchOptions, fetchMaterials]);

  const handleOpenAdd = () => {
    setSelectedMaterial(null);
    setFormData({
      assignmentKey: classesOptions.length > 0 ? `${classesOptions[0].class_id}_${classesOptions[0].section_id}_${classesOptions[0].subject_id}` : '',
      title: '',
      description: '',
      unitName: '',
      topicName: '',
      materialType: 'file',
      externalUrl: '',
      file: null
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat) => {
    setSelectedMaterial(mat);
    setFormData({
      assignmentKey: `${mat.class_id}_${mat.section_id}_${mat.subject_id}`,
      title: mat.title || '',
      description: mat.description || '',
      unitName: mat.unit_name || '',
      topicName: mat.topic_name || '',
      materialType: mat.material_type || 'file',
      externalUrl: mat.external_url || '',
      file: null
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.assignmentKey || !formData.title || !formData.unitName || !formData.topicName) {
      setFormError('Class selection, Title, Unit, and Topic are required.');
      return;
    }

    if (formData.materialType === 'file' && !selectedMaterial && !formData.file) {
      setFormError('Please select a file to upload (PDF, DOCX, PPTX, image).');
      return;
    }

    if (formData.materialType === 'link' && !formData.externalUrl) {
      setFormError('External URL is required for link type material.');
      return;
    }

    const [classId, sectionId, subjectId] = formData.assignmentKey.split('_');

    const body = new FormData();
    body.append('classId', classId);
    body.append('sectionId', sectionId);
    body.append('subjectId', subjectId);
    body.append('title', formData.title);
    body.append('description', formData.description);
    body.append('unitName', formData.unitName);
    body.append('topicName', formData.topicName);
    body.append('materialType', formData.materialType);

    if (formData.materialType === 'link') {
      body.append('externalUrl', formData.externalUrl);
    } else if (formData.file) {
      body.append('file', formData.file);
    }

    try {
      setSubmitting(true);
      if (selectedMaterial) {
        await updateMaterialApi(selectedMaterial.id, body);
      } else {
        await uploadMaterialApi(body);
      }
      setIsModalOpen(false);
      fetchMaterials();
    } catch (err) {
      setFormError(err.message || 'Failed to save material.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const res = await deleteMaterialApi(selectedMaterial.id);
      if (res.success) {
        setIsDeleteOpen(false);
        fetchMaterials();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Title & Unit',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.title}</span>
          <p className="text-xs text-slate-400">Unit: {row.unit_name} | Topic: {row.topic_name}</p>
        </div>
      )
    },
    { header: 'Class / Subject', accessor: 'class_name', render: (row) => `${row.class_name || ''} ${row.section_name ? `- ${row.section_name}` : ''} (${row.subject_name || ''})` },
    {
      header: 'Attachment / Link',
      accessor: 'file_url',
      render: (row) => (
        row.file_url ? (
          <a href={`http://localhost:5000${row.file_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-600 hover:underline">
            <FileText className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        ) : row.external_url ? (
          <a href={row.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>External Link</span>
          </a>
        ) : (
          <span className="text-slate-400 text-xs">No attachment</span>
        )
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
          <button onClick={() => { setSelectedMaterial(row); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials Management"
        description="Upload course documents, syllabus PDFs, presentation slides, and external reference links"
        actions={
          <button onClick={handleOpenAdd} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Upload Material</span>
          </button>
        }
      />

      <DataTable columns={columns} data={materials} isLoading={loading} error={error} onRetry={fetchMaterials} />

      {/* Upload/Edit Modal */}
      <FormModal isOpen={isModalOpen} title={selectedMaterial ? 'Edit Study Material' : 'Upload Study Material'} onClose={() => setIsModalOpen(false)}>
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
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Chapter 1 Calculus Slides" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Unit Name *</label>
              <input type="text" required value={formData.unitName} onChange={(e) => setFormData({ ...formData, unitName: e.target.value })} placeholder="e.g. Unit 1" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Topic Name *</label>
              <input type="text" required value={formData.topicName} onChange={(e) => setFormData({ ...formData, topicName: e.target.value })} placeholder="e.g. Limits & Derivatives" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Material Resource Type</label>
            <div className="flex space-x-4 text-xs font-semibold">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input type="radio" name="matType" value="file" checked={formData.materialType === 'file'} onChange={() => setFormData({ ...formData, materialType: 'file' })} className="text-primary-600" />
                <span>Upload File (PDF/DOCX/PPTX)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input type="radio" name="matType" value="link" checked={formData.materialType === 'link'} onChange={() => setFormData({ ...formData, materialType: 'link' })} className="text-primary-600" />
                <span>External Link URL</span>
              </label>
            </div>
          </div>

          {formData.materialType === 'file' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Choose File</label>
              <input type="file" onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })} className="w-full text-xs text-slate-600 border rounded-lg p-2" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">External URL *</label>
              <input type="url" value={formData.externalUrl} onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })} placeholder="https://example.com/notes" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          )}

          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Material</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Study Material"
        message={`Are you sure you want to delete "${selectedMaterial?.title}"?`}
        confirmText="Delete Material"
        isDanger={true}
        isLoading={submitting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default TeacherMaterials;
