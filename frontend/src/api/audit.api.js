import axiosClient from './axiosClient';

export const getAuditLogsApi = (params) => axiosClient.get('/audit-logs', { params });
export const getAuditLogByIdApi = (id) => axiosClient.get(`/audit-logs/${id}`);
