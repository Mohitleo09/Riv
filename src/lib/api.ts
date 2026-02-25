import axios from 'axios';
import { Blog, Comment, FeedResponse, User, LoginCredentials, RegisterCredentials, AuthResponse } from './types';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const rfToken = localStorage.getItem('refreshToken');
                const userId = localStorage.getItem('userId');
                if (!rfToken || !userId) throw new Error('No refresh token');

                const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refresh_token: rfToken,
                    userId
                });

                localStorage.setItem('token', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch (err) {
                localStorage.clear();
                if (typeof window !== 'undefined') window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: LoginCredentials) => api.post<AuthResponse>('/auth/login', data),
    register: (data: RegisterCredentials) => api.post<AuthResponse>('/auth/register', data),
    getProfile: () => api.get<User>('/auth/profile'),
};

export const blogApi = {
    getFeed: (page = 1, limit = 10) => api.get<FeedResponse>(`/public/feed?page=${page}&limit=${limit}`),
    getMyBlogs: () => api.get<Blog[]>('/blogs/me'),
    getBlogById: (id: string) => api.get<Blog>(`/blogs/${id}`),
    getBlogBySlug: (slug: string) => api.get<Blog>(`/public/blogs/${slug}`),
    createBlog: (data: Partial<Blog>) => api.post<Blog>('/blogs', data),
    updateBlog: (id: string, data: Partial<Blog>) => api.patch<Blog>(`/blogs/${id}`, data),
    deleteBlog: (id: string) => api.delete(`/blogs/${id}`),
    likeBlog: (id: string) => api.post<{ likes: number }>(`/blogs/${id}/like`),
    unlikeBlog: (id: string) => api.delete<{ likes: number }>(`/blogs/${id}/like`),
    addComment: (id: string, content: string) => api.post<Comment>(`/blogs/${id}/comments`, { content }),
    getComments: (id: string) => api.get<Comment[]>(`/blogs/${id}/comments`),
    likeComment: (commentId: string) => api.post<{ likes: number }>(`/comments/${commentId}/like`),
    unlikeComment: (commentId: string) => api.delete<{ likes: number }>(`/comments/${commentId}/like`),
};

export default api;
