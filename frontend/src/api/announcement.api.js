import axiosClient from './axiosClient';

export const getAnnouncementsApi = () => axiosClient.get('/announcements');
export const createAnnouncementApi = (data) => axiosClient.post('/announcements', data);
export const updateAnnouncementApi = (id, data) => axiosClient.put(`/announcements/${id}`, data);
export const deleteAnnouncementApi = (id) => axiosClient.delete(`/announcements/${id}`);
