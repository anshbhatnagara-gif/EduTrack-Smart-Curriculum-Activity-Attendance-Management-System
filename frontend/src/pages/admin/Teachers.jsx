import React, { useEffect, useState, useCallback } from 'react';
import {
  getTeachersApi,
  createTeacherApi,
  updateTeacherApi,
  updateTeacherStatusApi
} from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { UserPlus, Edit, Eye, Power, CheckCircle, AlertCircle } from 'lucide-react';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    employeeCode: '',
    qualification: '',
    joiningDate: ''
  });

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeachersApi({
        page,
        limit: 10,
        search,
        status: statusFilter
      });
      if (res.success) {
        setTeachers(res.data || []);
        if (res.meta?.pagination) {
          setPagination({
            totalPages: res.meta.pagination.totalPages,
            totalItems: res.meta.pagination.total
          });
        }
      } else {
        setError(res.message || 'Failed to fetch teachers.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.employeeCode || !formData.qualification || !formData.joiningDate) {
      setFormError('All required fields must be filled out.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await createTeacherApi(formData);
      if (res.success) {
        setIsAddOpen(false);
        setFormData({ fullName: '', email: '', phone: '', password: '', employeeCode: '', qualification: '', joiningDate: '' });
        fetchTeachers();
      } else {
        setFormError(res.message || 'Failed to create teacher.');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating teacher.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditOpen = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      fullName: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '',
      employeeCode: teacher.employee_code || '',
      qualification: teacher.qualification || '',
      joiningDate: teacher.joining_date ? new Date(teacher.joining_date).toISOString().split('T')[0] : ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setFormSubmitting(true);
      const res = await updateTeacherApi(selectedTeacher.teacher_id || selectedTeacher.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        qualification: formData.qualification,
        joiningDate: formData.joiningDate
      });
      if (res.success) {
        setIsEditOpen(false);
        fetchTeachers();
      } else {
        setFormError(res.message || 'Failed to update teacher.');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating teacher.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setFormSubmitting(true);
      const newStatus = selectedTeacher.status === 'active' ? 'inactive' : 'active';
      const res = await updateTeacherStatusApi(selectedTeacher.teacher_id || selectedTeacher.id, newStatus);
      if (res.success) {
        setIsStatusOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Teacher Name',
      accessor: 'full_name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-400">{row.employee_code}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Qualification', accessor: 'qualification' },
    { header: 'Joining Date', accessor: 'joining_date', render: (row) => row.joining_date ? new Date(row.joining_date).toLocaleDateString() : 'N/A' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setSelectedTeacher(row); setIsViewOpen(true); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditOpen(row)}
            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50"
            title="Edit Teacher"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setSelectedTeacher(row); setIsStatusOpen(true); }}
            className={`p-1.5 rounded-lg ${row.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Management"
        description="Register staff members, view credentials, and update active employment statuses"
        actions={
          <button
            type="button"
            onClick={() => { setFormError(''); setFormData({ fullName: '', email: '', phone: '', password: '', employeeCode: '', qualification: '', joiningDate: '' }); setIsAddOpen(true); }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search by name or email..."
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

      {/* Teachers Table */}
      <DataTable
        columns={columns}
        data={teachers}
        isLoading={loading}
        error={error}
        onRetry={fetchTeachers}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* Add Teacher Modal */}
      <FormModal isOpen={isAddOpen} title="Register New Teacher" onClose={() => setIsAddOpen(false)}>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Employee Code *</label>
              <input type="text" required name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} placeholder="e.g. T-1004" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Qualification *</label>
              <input type="text" required name="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. M.Sc Mathematics" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Joining Date *</label>
              <input type="date" required name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Submit Registration</button>
          </div>
        </form>
      </FormModal>

      {/* Edit Teacher Modal */}
      <FormModal isOpen={isEditOpen} title="Edit Teacher Details" onClose={() => setIsEditOpen(false)}>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Qualification *</label>
              <input type="text" required name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Joining Date *</label>
              <input type="date" required name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Changes</button>
          </div>
        </form>
      </FormModal>

      {/* View Teacher Details Modal */}
      <FormModal isOpen={isViewOpen} title="Teacher Profile Details" onClose={() => setIsViewOpen(false)}>
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg flex items-center justify-center">
                {selectedTeacher.full_name ? selectedTeacher.full_name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedTeacher.full_name}</h4>
                <p className="text-xs text-slate-500">Employee Code: {selectedTeacher.employee_code}</p>
                <StatusBadge status={selectedTeacher.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="font-semibold text-slate-500">Email:</span> <p className="text-slate-800 font-medium">{selectedTeacher.email}</p></div>
              <div><span className="font-semibold text-slate-500">Phone:</span> <p className="text-slate-800 font-medium">{selectedTeacher.phone || 'N/A'}</p></div>
              <div><span className="font-semibold text-slate-500">Qualification:</span> <p className="text-slate-800 font-medium">{selectedTeacher.qualification}</p></div>
              <div><span className="font-semibold text-slate-500">Joining Date:</span> <p className="text-slate-800 font-medium">{selectedTeacher.joining_date ? new Date(selectedTeacher.joining_date).toLocaleDateString() : 'N/A'}</p></div>
            </div>
          </div>
        )}
      </FormModal>

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={isStatusOpen}
        title="Toggle Teacher Status"
        message={`Are you sure you want to ${selectedTeacher?.status === 'active' ? 'deactivate' : 'activate'} ${selectedTeacher?.full_name}?`}
        confirmText={selectedTeacher?.status === 'active' ? 'Deactivate' : 'Activate'}
        isDanger={selectedTeacher?.status === 'active'}
        isLoading={formSubmitting}
        onConfirm={handleStatusToggle}
        onCancel={() => setIsStatusOpen(false)}
      />
    </div>
  );
};

export default Teachers;
