import axios from 'axios';

// VITE_API_URL is set at build time (e.g. in Vercel's project settings) to point at the
// deployed backend. Falls back to localhost so local dev keeps working unchanged.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Request interceptor — attach the access token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — refresh the token when it expires
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // A 401 from the login or refresh endpoints themselves means "wrong credentials" /
        // "no valid session" — not an expired access token — so it must NOT trigger the
        // refresh-and-retry flow below. Letting it through here used to hijack a failed
        // login attempt: it tried (and failed) to refresh, then force-navigated to the
        // hardcoded school-admin '/login' route via window.location.href, unmounting the
        // page before the caller's own toast.error() could run — so a wrong-password
        // attempt on either login page silently bounced to '/login' with no visible error.
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = res.data.data.accessToken;
                localStorage.setItem('accessToken', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return axiosInstance(originalRequest);
            } catch (err) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;