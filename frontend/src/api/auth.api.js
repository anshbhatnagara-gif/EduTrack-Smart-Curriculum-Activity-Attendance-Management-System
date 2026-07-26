import axiosClient from './axiosClient';

export const loginApi = async (email, password) => {
  return axiosClient.post('/auth/login', { email, password });
};

export const getMeApi = async () => {
  return axiosClient.get('/auth/me');
};

export const logoutApi = async () => {
  return axiosClient.post('/auth/logout');
};

export const changePasswordApi = async (oldPassword, newPassword) => {
  return axiosClient.put('/auth/change-password', { oldPassword, newPassword });
};
