import axiosInstance from '../config/axios';

// ── School Admin ───────────────────────────────────────
export const requestSubdomainApi = async (label) => {
    const response = await axiosInstance.post('/subdomain-requests', { label });
    return response.data;
};

export const getMySubdomainRequestApi = async () => {
    const response = await axiosInstance.get('/subdomain-requests/mine');
    return response.data;
};

// ── Super Admin ────────────────────────────────────────
export const getPendingSubdomainRequestsApi = async () => {
    const response = await axiosInstance.get('/subdomain-requests/pending');
    return response.data;
};

export const fulfillSubdomainRequestApi = async (id) => {
    const response = await axiosInstance.patch(`/subdomain-requests/${id}/fulfill`);
    return response.data;
};

export const rejectSubdomainRequestApi = async (id) => {
    const response = await axiosInstance.patch(`/subdomain-requests/${id}/reject`);
    return response.data;
};
