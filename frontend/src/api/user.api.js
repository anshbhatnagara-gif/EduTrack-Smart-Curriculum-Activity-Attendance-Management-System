import axiosClient from './axiosClient';

export const getMyProfileApi = () => axiosClient.get('/users/profile');
export const updateMyProfileApi = (formData) => 
  axiosClient.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
export const getMyChildrenApi = () => axiosClient.get('/users/children');
export const getChildDetailsApi = (childStudentId) => axiosClient.get(`/users/children/${childStudentId}`);
