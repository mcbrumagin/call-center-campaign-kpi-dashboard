const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname.includes('manus.computer') 
    ? window.location.origin.replace('3000-', '8000-') 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'))
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('API_BASE_URL', API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.detail || `HTTP error ${response.status}`,
      response.status,
      data
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(
        data.detail || 'Login failed',
        response.status,
        data
      );
    }

    return response.json();
  },

  me: (token: string) => fetchApi<{ username: string; role: string }>('/api/auth/me', { token }),
};

// Agents API
export interface Agent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  campaigns: { id: number; name: string; is_active: boolean }[];
}

export interface AgentListResponse {
  data: Agent[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateAgentInput {
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
}

export interface UpdateAgentInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
}

export const agentsApi = {
  list: (token: string, params?: { page?: number; limit?: number; search?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
    
    const query = searchParams.toString();
    return fetchApi<AgentListResponse>(`/api/agents${query ? `?${query}` : ''}`, { token });
  },

  get: (token: string, id: number) => fetchApi<Agent>(`/api/agents/${id}`, { token }),

  create: (token: string, data: CreateAgentInput) =>
    fetchApi<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: number, data: UpdateAgentInput) =>
    fetchApi<Agent>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: number) =>
    fetchApi<void>(`/api/agents/${id}`, {
      method: 'DELETE',
      token,
    }),

  assignCampaigns: (token: string, agentId: number, campaignIds: number[]) =>
    fetchApi<{ message: string; count: number }>(`/api/agents/${agentId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify({ campaign_ids: campaignIds }),
      token,
    }),

  removeCampaign: (token: string, agentId: number, campaignId: number) =>
    fetchApi<void>(`/api/agents/${agentId}/campaigns/${campaignId}`, {
      method: 'DELETE',
      token,
    }),
};

// Campaigns API
export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  agent_count: number;
}

export interface CampaignDetail {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  agents: { id: number; first_name: string; last_name: string; email: string }[];
}

export interface CampaignListResponse {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export const campaignsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
    
    const query = searchParams.toString();
    return fetchApi<CampaignListResponse>(`/api/campaigns${query ? `?${query}` : ''}`);
  },

  get: (id: number) => fetchApi<CampaignDetail>(`/api/campaigns/${id}`),

  create: (token: string, data: CreateCampaignInput) =>
    fetchApi<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: number, data: UpdateCampaignInput) =>
    fetchApi<CampaignDetail>(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: number) =>
    fetchApi<void>(`/api/campaigns/${id}`, {
      method: 'DELETE',
      token,
    }),

  assignAgents: (token: string, campaignId: number, agentIds: number[]) =>
    fetchApi<{ message: string; count: number }>(`/api/campaigns/${campaignId}/agents`, {
      method: 'POST',
      body: JSON.stringify({ agent_ids: agentIds }),
      token,
    }),

  removeAgent: (token: string, campaignId: number, agentId: number) =>
    fetchApi<void>(`/api/campaigns/${campaignId}/agents/${agentId}`, {
      method: 'DELETE',
      token,
    }),
};

// KPIs API
export type BadgeType = 'platinum' | 'gold' | 'silver' | 'bronze' | null;

export interface KPIDataPoint {
  date: string;
  hours: number;
  badge: BadgeType;
  days_in_period: number;
  is_complete: boolean;
}

export interface KPIResponse {
  campaign: { id: number; name: string; is_active: boolean };
  period: { start_date: string; end_date: string; group_by: string };
  data: KPIDataPoint[];
  summary: {
    total_hours: number;
    average_daily_hours: number;
    days_with_data: number;
  };
}

export interface BadgeBreakdown {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  none: number;
}

export interface BadgeSummaryResponse {
  campaign: { id: number; name: string; is_active: boolean };
  period: { start_date: string; end_date: string };
  badge_breakdown: BadgeBreakdown;
  total_days: number;
  total_hours: number;
  average_daily_hours: number;
  average_badge: BadgeType;
}

export interface DailyBadgeResponse {
  date: string;
  hours: number;
  badge: BadgeType;
  threshold: number;
  next_badge: BadgeType;
  hours_to_next: number;
}

export const kpisApi = {
  getCampaignKPIs: (
    campaignId: number,
    params?: { start_date?: string; end_date?: string; group_by?: 'day' | 'week' | 'month' }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.group_by) searchParams.set('group_by', params.group_by);
    
    const query = searchParams.toString();
    return fetchApi<KPIResponse>(`/api/kpis/campaigns/${campaignId}${query ? `?${query}` : ''}`);
  },

  getDailyBadge: (campaignId: number, date?: string) => {
    const searchParams = new URLSearchParams();
    if (date) searchParams.set('target_date', date);
    
    const query = searchParams.toString();
    console.log('query', query);
    return fetchApi<DailyBadgeResponse>(`/api/kpis/campaigns/${campaignId}/badge${query ? `?${query}` : ''}`);
  },

  getBadgeSummary: (
    campaignId: number,
    params?: { start_date?: string; end_date?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    
    const query = searchParams.toString();
    return fetchApi<BadgeSummaryResponse>(`/api/kpis/campaigns/${campaignId}/badge-summary${query ? `?${query}` : ''}`);
  },

  getBadgeThresholds: () =>
    fetchApi<{ thresholds: Record<string, number>; description: string }>('/api/kpis/badge-thresholds'),
};

export { ApiError };
