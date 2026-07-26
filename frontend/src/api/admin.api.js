import axiosClient from './axiosClient';

// Teachers
export const getTeachersApi = (params) => axiosClient.get('/admin/teachers', { params });
export const createTeacherApi = (data) => axiosClient.post('/admin/teachers', data);
export const getTeacherByIdApi = (id) => axiosClient.get(`/admin/teachers/${id}`);
export const updateTeacherApi = (id, data) => axiosClient.put(`/admin/teachers/${id}`, data);
export const updateTeacherStatusApi = (id, status) => axiosClient.patch(`/admin/teachers/${id}/status`, { status });

// Students
export const getStudentsApi = (params) => axiosClient.get('/admin/students', { params });
export const createStudentApi = (data) => axiosClient.post('/admin/students', data);
export const getStudentByIdApi = (id) => axiosClient.get(`/admin/students/${id}`);
export const updateStudentApi = (id, data) => axiosClient.put(`/admin/students/${id}`, data);
export const updateStudentStatusApi = (id, status) => axiosClient.patch(`/admin/students/${id}/status`, { status });

// Parents
export const getParentsApi = (params) => axiosClient.get('/admin/parents', { params });
export const createParentApi = (data) => axiosClient.post('/admin/parents', data);
export const getParentByIdApi = (id) => axiosClient.get(`/admin/parents/${id}`);
export const updateParentApi = (id, data) => axiosClient.put(`/admin/parents/${id}`, data);
export const updateParentStatusApi = (id, status) => axiosClient.patch(`/admin/parents/${id}/status`, { status });

// Links
export const linkParentStudentApi = (data) => axiosClient.post('/admin/parents/link', data);
export const getLinkedStudentsAdminApi = (parentId) => axiosClient.get(`/admin/parents/${parentId}/students`);
