import axiosClient from './axiosClient';

export const getMyNotificationsApi = () => axiosClient.get('/notifications');
export const markNotificationReadApi = (id) => axiosClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => axiosClient.patch('/notifications/read-all');
