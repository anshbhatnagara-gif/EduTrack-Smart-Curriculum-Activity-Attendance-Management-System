import axiosClient from './axiosClient';

export const loginApi = async (email, password) => {
  return axiosClient.post('/auth/login', { email, password });
};

export const getMeApi = async () => {
  return axiosClient.get('/auth/me');
};

export const forgotPasswordApi = async (email) => {
  return axiosClient.post('/auth/forgot-password', { email });
};

export const verifyOtpApi = async (email, otp) => {
  return axiosClient.post('/auth/verify-reset-otp', { email, otp });
};

export const resetPasswordApi = async (token, newPassword) => {
  return axiosClient.post('/auth/reset-password', { token, newPassword });
};

export const logoutApi = async () => {
  return axiosClient.post('/auth/logout');
};

export const changePasswordApi = async (oldPassword, newPassword) => {
  return axiosClient.put('/auth/change-password', { oldPassword, newPassword });
};
