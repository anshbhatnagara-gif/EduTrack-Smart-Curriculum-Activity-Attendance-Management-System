import axiosClient from './axiosClient';

export const getMaterialsApi = (params) => axiosClient.get('/materials', { params });
export const getMaterialByIdApi = (id) => axiosClient.get(`/materials/${id}`);
export const uploadMaterialApi = (formData) => axiosClient.post('/materials', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateMaterialApi = (id, formData) => axiosClient.put(`/materials/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteMaterialApi = (id) => axiosClient.delete(`/materials/${id}`);
