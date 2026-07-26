import axiosClient from './axiosClient';

// Sessions
export const getSessionsApi = () => axiosClient.get('/academic/sessions');
export const createSessionApi = (data) => axiosClient.post('/academic/sessions', data);
export const updateSessionApi = (id, data) => axiosClient.put(`/academic/sessions/${id}`, data);

// Classes
export const getClassesApi = (params) => axiosClient.get('/academic/classes', { params });
export const createClassApi = (data) => axiosClient.post('/academic/classes', data);
export const updateClassApi = (id, data) => axiosClient.put(`/academic/classes/${id}`, data);

// Sections
export const getSectionsApi = (params) => axiosClient.get('/academic/sections', { params });
export const createSectionApi = (data) => axiosClient.post('/academic/sections', data);
export const updateSectionApi = (id, data) => axiosClient.put(`/academic/sections/${id}`, data);

// Subjects
export const getSubjectsApi = () => axiosClient.get('/academic/subjects');
export const createSubjectApi = (data) => axiosClient.post('/academic/subjects', data);
export const getSubjectByIdApi = (id) => axiosClient.get(`/academic/subjects/${id}`);
export const updateSubjectApi = (id, data) => axiosClient.put(`/academic/subjects/${id}`, data);

// Teacher Assignments
export const getTeacherAssignmentsAdminApi = (params) => axiosClient.get('/academic/assignments', { params });
export const assignTeacherApi = (data) => axiosClient.post('/academic/assignments', data);
export const removeTeacherAssignmentApi = (id) => axiosClient.delete(`/academic/assignments/${id}`);

// Student Enrollments
export const getStudentEnrollmentsApi = (params) => axiosClient.get('/academic/enrollments', { params });
export const enrollStudentApi = (data) => axiosClient.post('/academic/enrollments', data);
export const updateEnrollmentStatusApi = (id, data) => axiosClient.put(`/academic/enrollments/${id}`, data);
