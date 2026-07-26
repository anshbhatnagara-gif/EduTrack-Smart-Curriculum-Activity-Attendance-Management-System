import axiosClient from './axiosClient';

export const getExamsApi = (params) => axiosClient.get('/marks/exams', { params });
export const createExamApi = (data) => axiosClient.post('/marks/exams', data);
export const recordMarksApi = (data) => axiosClient.post('/marks', data);
export const updateMarksApi = (id, data) => axiosClient.put(`/marks/${id}`, data);
export const getMyMarksApi = () => axiosClient.get('/marks/student/me');
export const getStudentMarksApi = (studentId) => axiosClient.get(`/marks/student/${studentId}`);
export const getClassMarksApi = (classId, params) => axiosClient.get(`/marks/class/${classId}`, { params });
