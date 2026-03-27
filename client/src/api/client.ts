import axios from 'axios';
import type {
  Tenant,
  CampaignType,
  Campaign,
  ApiResponse,
  TenantStats,
  InstantlyCampaign,
  SheetLeadCount,
  AuthUser,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stored token so the app redirects to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  status: () =>
    api.get<ApiResponse<{ hasUsers: boolean }>>('/auth/status').then((r) => r.data),
  register: (username: string, password: string) =>
    api.post<ApiResponse<{ token: string; username: string }>>('/auth/register', { username, password }).then((r) => r.data),
  requestAccess: (username: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/request', { username, password }).then((r) => r.data),
  login: (username: string, password: string) =>
    api.post<ApiResponse<{ token: string; username: string }>>('/auth/login', { username, password }).then((r) => r.data),
  me: () =>
    api.get<ApiResponse<AuthUser>>('/auth/me').then((r) => r.data),
  getPending: () =>
    api.get<ApiResponse<AuthUser[]>>('/auth/pending').then((r) => r.data),
  getUsers: () =>
    api.get<ApiResponse<AuthUser[]>>('/auth/users').then((r) => r.data),
  approve: (id: string) =>
    api.post<ApiResponse<AuthUser>>(`/auth/approve/${id}`).then((r) => r.data),
  reject: (id: string) =>
    api.post<ApiResponse<AuthUser>>(`/auth/reject/${id}`).then((r) => r.data),
  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/auth/users/${id}`).then((r) => r.data),
};

// ── Tenants ──────────────────────────────────────────────
export const tenantApi = {
  getAll: () => api.get<ApiResponse<Tenant[]>>('/tenants').then((r) => r.data),
  getById: (id: string) => api.get<ApiResponse<Tenant>>(`/tenants/${id}`).then((r) => r.data),
  getStats: (id: string) =>
    api.get<ApiResponse<TenantStats>>(`/tenants/${id}/stats`).then((r) => r.data),
  getInstantlyCampaigns: (id: string) =>
    api.get<ApiResponse<InstantlyCampaign[]>>(`/tenants/${id}/instantly-campaigns`).then((r) => r.data),
  create: (data: Partial<Tenant>) =>
    api.post<ApiResponse<Tenant>>('/tenants', data).then((r) => r.data),
  update: (id: string, data: Partial<Tenant>) =>
    api.put<ApiResponse<Tenant>>(`/tenants/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/tenants/${id}`).then((r) => r.data),
};

// ── Campaign Types ───────────────────────────────────────
export const campaignTypeApi = {
  getAll: (tenantId?: string) =>
    api
      .get<ApiResponse<CampaignType[]>>('/campaign-types', {
        params: tenantId ? { tenantId } : {},
      })
      .then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<CampaignType>>(`/campaign-types/${id}`).then((r) => r.data),
  create: (data: Partial<CampaignType>) =>
    api.post<ApiResponse<CampaignType>>('/campaign-types', data).then((r) => r.data),
  update: (id: string, data: Partial<CampaignType>) =>
    api.put<ApiResponse<CampaignType>>(`/campaign-types/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/campaign-types/${id}`).then((r) => r.data),
};

// ── Stats ─────────────────────────────────────────────────
export const statsApi = {
  getLeads: (tenantId?: string) =>
    api
      .get<ApiResponse<SheetLeadCount[]>>('/stats/leads', {
        params: tenantId ? { tenantId } : {},
      })
      .then((r) => r.data),
};

// ── Campaigns ────────────────────────────────────────────
export const campaignApi = {
  getAll: (filters?: { tenantId?: string; campaignTypeId?: string }) =>
    api
      .get<ApiResponse<Campaign[]>>('/campaigns', { params: filters || {} })
      .then((r) => r.data),
  getById: (id: string) =>
    api.get<ApiResponse<Campaign>>(`/campaigns/${id}`).then((r) => r.data),
  create: (data: Partial<Campaign>) =>
    api.post<ApiResponse<Campaign>>('/campaigns', data).then((r) => r.data),
  update: (id: string, data: Partial<Campaign>) =>
    api.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/campaigns/${id}`).then((r) => r.data),
};
