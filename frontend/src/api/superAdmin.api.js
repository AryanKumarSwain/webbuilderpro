import axiosInstance from '../config/axios';
import { compressFormDataImage } from '../utils/compressImage';

// ── Schools ──────────────────────────────────────────
export const getAllSchoolsApi = async () => {
    const response = await axiosInstance.get('/super-admin/schools');
    return response.data;
};

export const getSchoolByUuidApi = async (uuid) => {
    const response = await axiosInstance.get(`/super-admin/schools/${uuid}`);
    return response.data;
};

export const createSchoolApi = async (schoolData) => {
    const response = await axiosInstance.post('/super-admin/schools', schoolData);
    return response.data;
};

export const updateSchoolStatusApi = async (uuid, status) => {
    const response = await axiosInstance.patch(
        `/super-admin/schools/${uuid}/status`,
        { status }
    );
    return response.data;
};

export const deleteSchoolApi = async (uuid) => {
    const response = await axiosInstance.delete(`/super-admin/schools/${uuid}`);
    return response.data;
};

// ── Admins ───────────────────────────────────────────
export const createAdminApi = async (adminData) => {
    const response = await axiosInstance.post('/super-admin/admins', adminData);
    return response.data;
};

export const updateAdminStatusApi = async (uuid, status) => {
    const response = await axiosInstance.patch(
        `/super-admin/admins/${uuid}/status`,
        { status }
    );
    return response.data;
};

export const createSchoolWithAdminApi = async (data) => {
    await compressFormDataImage(data, 'schoolImage');
    const response = await axiosInstance.post(
        '/super-admin/schools/create-with-admin',
        data,
        {
            headers: { 'Content-Type': 'multipart/form-data' }
        }
    );
    return response.data;
};

export const getDashboardStatsApi = async () => {
    const response = await axiosInstance.get('/super-admin/dashboard-stats');
    return response.data;
};