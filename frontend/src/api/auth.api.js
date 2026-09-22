import axiosInstance from '../config/axios';

export const loginApi = async (email, password, role) => {
    const response = await axiosInstance.post('/auth/login', {
        email,
        password,
        role
    });
    return response.data;
};

export const logoutApi = async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
};

export const refreshTokenApi = async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
};

export const forgotPasswordApi = async (email, role) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email, role });
    return response.data;
};

export const resetPasswordApi = async (token, role, newPassword) => {
    const response = await axiosInstance.post('/auth/reset-password', { token, role, newPassword });
    return response.data;
};

export const changePasswordApi = async (currentPassword, newPassword) => {
    const response = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
};

export const completeGoogleSignupApi = async (data) => {
    const response = await axiosInstance.post('/auth/google/complete-signup', data);
    return response.data;
};

export const getGoogleAuthUrl = (role = 'admin') => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/auth/google?role=${encodeURIComponent(role)}`;
};