import axiosClient from './axiosClient';

export const getTeacherClassesApi = () => axiosClient.get('/teacher/assignments');
export const getAttendanceStudentsApi = (params) => axiosClient.get('/attendance/students', { params });
export const submitAttendanceApi = (data) => axiosClient.post('/attendance', data);
export const getAttendanceSessionsApi = (params) => axiosClient.get('/attendance/sessions', { params });
export const getAttendanceSessionByIdApi = (id) => axiosClient.get(`/attendance/sessions/${id}`);
export const correctAttendanceRecordApi = (id, data) => axiosClient.put(`/attendance/records/${id}`, data);
export const getMyAttendanceApi = () => axiosClient.get('/attendance/student/me');
export const getStudentAttendanceApi = (studentId) => axiosClient.get(`/attendance/student/${studentId}`);
export const getClassAttendanceStatsApi = (classId, params) => axiosClient.get(`/attendance/class/${classId}`, { params });
