import axiosClient from './axiosClient';

export const getTimetableApi = (params) => axiosClient.get('/timetable', { params });
export const getMyTimetableApi = () => axiosClient.get('/timetable/me');
export const createTimetableEntryApi = (data) => axiosClient.post('/timetable', data);
export const updateTimetableEntryApi = (id, data) => axiosClient.put(`/timetable/${id}`, data);
export const deleteTimetableEntryApi = (id) => axiosClient.delete(`/timetable/${id}`);
