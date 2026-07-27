import axiosClient from './axiosClient';

export const getAdminDashboardApi = () => axiosClient.get('/reports/admin-dashboard');
export const getTeacherDashboardApi = () => axiosClient.get('/reports/teacher-dashboard');
export const getStudentDashboardApi = () => axiosClient.get('/reports/student-dashboard');
export const getParentDashboardApi = () => axiosClient.get('/reports/parent-dashboard');

export const getAttendanceReportApi = (params) => axiosClient.get('/reports/attendance', { params });
export const getPerformanceReportApi = (params) => axiosClient.get('/reports/performance', { params });
export const getStudentPerformanceReportApi = (studentId) => axiosClient.get(`/reports/student-performance/${studentId}`);

export const exportAttendanceReportApi = (params) => 
  axiosClient.get('/reports/export/attendance', { params, responseType: 'blob' });

export const exportPerformanceReportApi = (params) => 
  axiosClient.get('/reports/export/performance', { params, responseType: 'blob' });
