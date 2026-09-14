import axiosInstance from '../config/axios';

export const submitSignupApi = async (data) => {
    const response = await axiosInstance.post('/signup', data);
    return response.data;
};

export const verifySignupOtpApi = async (uuid, otp) => {
    const response = await axiosInstance.post('/signup/verify-otp', { uuid, otp });
    return response.data;
};

export const resendSignupOtpApi = async (uuid) => {
    const response = await axiosInstance.post('/signup/resend-otp', { uuid });
    return response.data;
};
