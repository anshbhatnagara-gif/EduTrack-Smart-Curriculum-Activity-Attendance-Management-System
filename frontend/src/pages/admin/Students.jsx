import React, { useEffect, useState, useCallback } from 'react';
import {
  getStudentsApi,
  createStudentApi,
  updateStudentApi,
  updateStudentStatusApi
} from '../../api/admin.api';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchInput from '../../components/common/SearchInput';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { UserPlus, Edit, Eye, Power, AlertCircle } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    admissionNumber: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: 'male',
    admissionDate: ''
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentsApi({
        page,
        limit: 10,
        search,
        status: statusFilter
      });
      if (res.success) {
        setStudents(res.data || []);
        if (res.meta?.pagination) {
          setPagination({
            totalPages: res.meta.pagination.totalPages,
            totalItems: res.meta.pagination.total
          });
        }
      } else {
        setError(res.message || 'Failed to fetch students.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.admissionNumber || !formData.rollNumber || !formData.dateOfBirth || !formData.admissionDate) {
      setFormError('All required fields must be filled out.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await createStudentApi(formData);
      if (res.success) {
        setIsAddOpen(false);
        setFormData({ fullName: '', email: '', phone: '', password: '', admissionNumber: '', rollNumber: '', dateOfBirth: '', gender: 'male', admissionDate: '' });
        fetchStudents();
      } else {
        setFormError(res.message || 'Failed to create student.');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating student.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditOpen = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      admissionNumber: student.admission_number || '',
      rollNumber: student.roll_number || '',
      dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
      gender: student.gender || 'male',
      admissionDate: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setFormSubmitting(true);
      const res = await updateStudentApi(selectedStudent.student_id || selectedStudent.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        rollNumber: formData.rollNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        admissionDate: formData.admissionDate
      });
      if (res.success) {
        setIsEditOpen(false);
        fetchStudents();
      } else {
        setFormError(res.message || 'Failed to update student.');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating student.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setFormSubmitting(true);
      const newStatus = selectedStudent.status === 'active' ? 'inactive' : 'active';
      const res = await updateStudentStatusApi(selectedStudent.student_id || selectedStudent.id, newStatus);
      if (res.success) {
        setIsStatusOpen(false);
        fetchStudents();
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'full_name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-400">Adm: {row.admission_number} | Roll: {row.roll_number}</div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Gender', accessor: 'gender', render: (row) => <span className="capitalize">{row.gender}</span> },
    { header: 'Class / Section', accessor: 'class_name', render: (row) => row.class_name ? `${row.class_name} - ${row.section_name || ''}` : 'Not Enrolled' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => { setSelectedStudent(row); setIsViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleEditOpen(row)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Edit Student">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedStudent(row); setIsStatusOpen(true); }} className={`p-1.5 rounded-lg ${row.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        description="Register students, assign roll numbers, and view profile records"
        actions={
          <button
            type="button"
            onClick={() => { setFormError(''); setFormData({ fullName: '', email: '', phone: '', password: '', admissionNumber: '', rollNumber: '', dateOfBirth: '', gender: 'male', admissionDate: '' }); setIsAddOpen(true); }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => setSearch('')}
          placeholder="Search by name, admission no..."
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
        data={students}
        isLoading={loading}
        error={error}
        onRetry={fetchStudents}
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* Add Student Modal */}
      <FormModal isOpen={isAddOpen} title="Register New Student" onClose={() => setIsAddOpen(false)}>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Admission Number *</label>
              <input type="text" required name="admissionNumber" value={formData.admissionNumber} onChange={handleInputChange} placeholder="e.g. ADM-2026-005" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Roll Number *</label>
              <input type="text" required name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} placeholder="e.g. 101" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Date of Birth *</label>
              <input type="date" required name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Admission Date *</label>
            <input type="date" required name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Register Student</button>
          </div>
        </form>
      </FormModal>

      {/* Edit Student Modal */}
      <FormModal isOpen={isEditOpen} title="Edit Student Profile" onClose={() => setIsEditOpen(false)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Roll Number *</label>
              <input type="text" required name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Date of Birth *</label>
              <input type="date" required name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Admission Date *</label>
            <input type="date" required name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="pt-3 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">Save Changes</button>
          </div>
        </form>
      </FormModal>

      {/* View Details Modal */}
      <FormModal isOpen={isViewOpen} title="Student Profile Details" onClose={() => setIsViewOpen(false)}>
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
                {selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedStudent.full_name}</h4>
                <p className="text-xs text-slate-500">Admission No: {selectedStudent.admission_number} | Roll No: {selectedStudent.roll_number}</p>
                <StatusBadge status={selectedStudent.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="font-semibold text-slate-500">Email:</span> <p className="text-slate-800 font-medium">{selectedStudent.email}</p></div>
              <div><span className="font-semibold text-slate-500">Phone:</span> <p className="text-slate-800 font-medium">{selectedStudent.phone || 'N/A'}</p></div>
              <div><span className="font-semibold text-slate-500">Gender:</span> <p className="text-slate-800 font-medium capitalize">{selectedStudent.gender}</p></div>
              <div><span className="font-semibold text-slate-500">Date of Birth:</span> <p className="text-slate-800 font-medium">{selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'}</p></div>
              <div><span className="font-semibold text-slate-500">Admission Date:</span> <p className="text-slate-800 font-medium">{selectedStudent.admission_date ? new Date(selectedStudent.admission_date).toLocaleDateString() : 'N/A'}</p></div>
              <div><span className="font-semibold text-slate-500">Class:</span> <p className="text-slate-800 font-medium">{selectedStudent.class_name ? `${selectedStudent.class_name} - ${selectedStudent.section_name}` : 'Not Enrolled'}</p></div>
            </div>
          </div>
        )}
      </FormModal>

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={isStatusOpen}
        title="Toggle Student Status"
        message={`Are you sure you want to ${selectedStudent?.status === 'active' ? 'deactivate' : 'activate'} ${selectedStudent?.full_name}?`}
        confirmText={selectedStudent?.status === 'active' ? 'Deactivate' : 'Activate'}
        isDanger={selectedStudent?.status === 'active'}
        isLoading={formSubmitting}
        onConfirm={handleStatusToggle}
        onCancel={() => setIsStatusOpen(false)}
      />
    </div>
  );
};

export default Students;
