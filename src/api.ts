import type { AuthSession, BootstrapData, MonthlyReport, ReportFilters, User } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const AUTH_TOKEN_KEY = 'monthly-report-auth-token';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'API request failed');
  }

  return response.json() as Promise<T>;
}

export function fetchBootstrap(month: string) {
  return request<BootstrapData>(`/bootstrap?month=${month}`);
}

export function login(account: string, password: string) {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  });
}

export function fetchMe() {
  return request<User>('/auth/me');
}

export function fetchReports(filters: ReportFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set('month', filters.month);
  if (filters.role) {
    searchParams.set('role', filters.role);
  }
  if (filters.status) {
    searchParams.set('status', filters.status);
  }
  if (filters.search.trim()) {
    searchParams.set('search', filters.search.trim());
  }

  return request<MonthlyReport[]>(`/reports?${searchParams.toString()}`);
}

export function fetchCurrentReport(userId: string, month: string) {
  return request<MonthlyReport>(`/reports/current?userId=${userId}&month=${month}`);
}

export function fetchReportDetail(id: string) {
  return request<MonthlyReport>(`/reports/${id}`);
}

export function saveReport(report: MonthlyReport) {
  return request<MonthlyReport>('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}
