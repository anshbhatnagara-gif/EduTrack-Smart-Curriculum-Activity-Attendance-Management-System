import axiosClient from './axiosClient';

export const getAssignmentsApi = (params) => axiosClient.get('/assignments', { params });
export const getAssignmentByIdApi = (id) => axiosClient.get(`/assignments/${id}`);
export const createAssignmentApi = (formData) => axiosClient.post('/assignments', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateAssignmentApi = (id, formData) => axiosClient.put(`/assignments/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteAssignmentApi = (id) => axiosClient.delete(`/assignments/${id}`);

export const submitAssignmentApi = (assignmentId, formData) => axiosClient.post(`/assignments/${assignmentId}/submissions`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getSubmissionsByAssignmentApi = (assignmentId) => axiosClient.get(`/assignments/${assignmentId}/submissions`);
export const getMySubmissionsApi = () => axiosClient.get('/submissions/me');
export const evaluateSubmissionApi = (submissionId, data) => axiosClient.put(`/submissions/${submissionId}/evaluate`, data);
