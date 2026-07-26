import React, { useEffect, useState, useCallback } from 'react';
import {
  getParentsApi,
  createParentApi,
  updateParentApi,
  updateParentStatusApi,
  linkParentStudentApi,
  getLinkedStudentsAdminApi,
  getStudentsApi
} from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { UserPlus, Edit, Eye, Power, Link2, AlertCircle } from 'lucide-react';

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [linkedChildren, setLinkedChildren] = useState([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Link Form state
  const [studentOptions, setStudentOptions] = useState([]);
  const [linkData, setLinkData] = useState({
    studentId: '',
    relationship: 'Father',
    isPrimary: true
  });

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    occupation: '',
    relationshipType: 'Father'
  });

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getParentsApi({
        page,
        limit: 10,
        search,
        status: statusFilter
      });
      if (res.success) {
        setParents(res.data || []);
        if (res.meta?.pagination) {
          setPagination({
            totalPages: res.meta.pagination.totalPages,
            totalItems: res.meta.pagination.total
          });
        }
      } else {
        setError(res.message || 'Failed to fetch parents.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.relationshipType) {
      setFormError('All required fields must be filled out.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await createParentApi(formData);
      if (res.success) {
        setIsAddOpen(false);
        setFormData({ fullName: '', email: '', phone: '', password: '', occupation: '', relationshipType: 'Father' });
        fetchParents();
      } else {
        setFormError(res.message || 'Failed to create parent.');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating parent.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditOpen = (parent) => {
    setSelectedParent(parent);
    setFormData({
      fullName: parent.full_name || '',
      email: parent.email || '',
      phone: parent.phone || '',
      password: '',
      occupation: parent.occupation || '',
      relationshipType: parent.relationship_type || 'Father'
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setFormSubmitting(true);
      const res = await updateParentApi(selectedParent.parent_id || selectedParent.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        occupation: formData.occupation,
        relationshipType: formData.relationshipType
      });
      if (res.success) {
        setIsEditOpen(false);
        fetchParents();
      } else {
        setFormError(res.message || 'Failed to update parent.');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating parent.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenLinkModal = async (parent) => {
    setSelectedParent(parent);
    setFormError('');
    setLinkData({ studentId: '', relationship: 'Father', isPrimary: true });
    setIsLinkOpen(true);

    try {
      const studRes = await getStudentsApi({ limit: 100 });
      if (studRes.success) {
        setStudentOptions(studRes.data || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!linkData.studentId) {
      setFormError('Please select a student to link.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await linkParentStudentApi({
        parentId: selectedParent.parent_id || selectedParent.id,
        studentId: parseInt(linkData.studentId, 10),
        relationship: linkData.relationship,
        isPrimary: linkData.isPrimary
      });
      if (res.success) {
        setIsLinkOpen(false);
        fetchParents();
      } else {
        setFormError(res.message || 'Failed to link student.');
      }
    } catch (err) {
      setFormError(err.message || 'Error linking student.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewDetails = async (parent) => {
    setSelectedParent(parent);
    setIsViewOpen(true);
    try {
      const res = await getLinkedStudentsAdminApi(parent.parent_id || parent.id);
      if (res.success) {
        setLinkedChildren(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setFormSubmitting(true);
      const newStatus = selectedParent.status === 'active' ? 'inactive' : 'active';
      const res = await updateParentStatusApi(selectedParent.parent_id || selectedParent.id, newStatus);
      if (res.success) {
        setIsStatusOpen(false);
        fetchParents();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Parent Name',
      accessor: 'full_name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-400">{row.relationship_type || 'Parent'}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Occupation', accessor: 'occupation', render: (row) => row.occupation || 'N/A' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleViewDetails(row)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="View Details & Children">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenLinkModal(row)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50" title="Link Child Student">
            <Link2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleEditOpen(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Edit Parent">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedParent(row); setIsStatusOpen(true); }} className={`p-1.5 rounded-lg ${row.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Management"
        description="Register parent accounts and link student profiles to parents"
        actions={
          <button
            type="button"
            onClick={() => { setFormError(''); setFormData({ fullName: '', email: '', phone: '', password: '', occupation: '', relationshipType: 'Father' }); setIsAddOpen(true); }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Parent</span>
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search by parent name or email..."
        />
        <FilterBar
          filters={[
            {
              key: 'status',
              value: statusFilter,
              options: [
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
              ]
            }
          ]}
          onChange={(key, val) => { setStatusFilter(val); setPage(1); }}
        />
      </div>

      <DataTable
        columns={columns}
        data={parents}
        isLoading={loading}
        error={error}
        onRetry={fetchParents}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* Add Parent Modal */}
      <FormModal isOpen={isAddOpen} title="Register New Parent" onClose={() => setIsAddOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
            <input type="text" required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
              <input type="email" required name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
              <input type="password" required name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relationship Type *</label>
              <select name="relationshipType" value={formData.relationshipType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Occupation</label>
            <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="e.g. Software Engineer" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Register Parent</button>
          </div>
        </form>
      </FormModal>

      {/* Edit Parent Modal */}
      <FormModal isOpen={isEditOpen} title="Edit Parent Profile" onClose={() => setIsEditOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
            <input type="text" required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
              <input type="email" required name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Occupation</label>
              <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relationship Type *</label>
              <select name="relationshipType" value={formData.relationshipType} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Changes</button>
          </div>
        </form>
      </FormModal>

      {/* Link Student Modal */}
      <FormModal isOpen={isLinkOpen} title={`Link Child to ${selectedParent?.full_name}`} onClose={() => setIsLinkOpen(false)}>
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Select Student *</label>
            <select
              value={linkData.studentId}
              onChange={(e) => setLinkData((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Student --</option>
              {studentOptions.map((s) => (
                <option key={s.student_id || s.id} value={s.student_id || s.id}>
                  {s.full_name} ({s.admission_number})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relationship</label>
              <select
                value={linkData.relationship}
                onChange={(e) => setLinkData((prev) => ({ ...prev, relationship: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={linkData.isPrimary}
                  onChange={(e) => setLinkData((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Primary Guardian</span>
              </label>
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsLinkOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">Link Student</button>
          </div>
        </form>
      </FormModal>

      {/* View Linked Children Modal */}
      <FormModal isOpen={isViewOpen} title="Parent Profile & Linked Children" onClose={() => setIsViewOpen(false)}>
        {selectedParent && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border">
              <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-bold text-lg flex items-center justify-center">
                {selectedParent.full_name ? selectedParent.full_name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedParent.full_name}</h4>
                <p className="text-xs text-slate-500">Email: {selectedParent.email} | Phone: {selectedParent.phone || 'N/A'}</p>
                <StatusBadge status={selectedParent.status} />
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Linked Children</h5>
              {linkedChildren.length > 0 ? (
                <div className="space-y-2">
                  {linkedChildren.map((c) => (
                    <div key={c.student_id} className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{c.full_name}</p>
                        <p className="text-slate-500">Adm: {c.admission_number} | Relationship: {c.relationship}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No linked children registered.</p>
              )}
            </div>
          </div>
        )}
      </FormModal>

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={isStatusOpen}
        title="Toggle Parent Status"
        message={`Are you sure you want to ${selectedParent?.status === 'active' ? 'deactivate' : 'activate'} ${selectedParent?.full_name}?`}
        confirmText={selectedParent?.status === 'active' ? 'Deactivate' : 'Activate'}
        isDanger={selectedParent?.status === 'active'}
        isLoading={formSubmitting}
        onConfirm={handleStatusToggle}
        onCancel={() => setIsStatusOpen(false)}
      />
    </div>
  );
};

export default Parents;
