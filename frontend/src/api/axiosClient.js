import axios from 'axios';
import { getToken, removeToken } from '../utils/tokenStorage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Authorization Token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle status codes and error normalization
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard backend response payload
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Handle 401 Unauthorized for protected requests (ignore login request)
    if (status === 401 && !url.includes('/auth/login')) {
      removeToken();
      // Dispatch custom event to notify AuthContext to clear state safely
      window.dispatchEvent(new CustomEvent('edutrack:unauthorized'));
    }

    // Normalize error message
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const errors = error.response?.data?.errors || [];

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.errors = errors;
    normalizedError.response = error.response;

    return Promise.reject(normalizedError);
  }
);

export default axiosClient;
