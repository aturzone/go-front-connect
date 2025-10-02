// API Configuration and HTTP Client

const API_CONFIG_KEY = 'gask_api_config';

export interface ApiConfig {
  baseUrl: string;
  ownerPassword?: string;
  userPassword?: string;
}

// Get API configuration from localStorage
export const getApiConfig = (): ApiConfig | null => {
  const stored = localStorage.getItem(API_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Save API configuration to localStorage
export const saveApiConfig = (config: ApiConfig): void => {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
};

// Clear API configuration
export const clearApiConfig = (): void => {
  localStorage.removeItem(API_CONFIG_KEY);
};

// Check if API is configured
export const isApiConfigured = (): boolean => {
  const config = getApiConfig();
  return !!(config?.baseUrl && (config?.ownerPassword || config?.userPassword));
};

// API request helper
interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const config = getApiConfig();
  
  if (!config) {
    throw new Error('API not configured. Please configure API settings first.');
  }

  const { requireAuth = true, ...fetchOptions } = options;

  const url = `${config.baseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  if (requireAuth) {
    // Import getUserAuth here to avoid circular dependency
    const authData = localStorage.getItem('gask_user_auth');
    const userAuth = authData ? JSON.parse(authData) : null;
    
    // Use appropriate password based on role
    if (userAuth?.role === 'owner') {
      headers['X-Owner-Password'] = config.ownerPassword || '';
    } else {
      // For group-admin and user roles, use userPassword
      headers['X-Owner-Password'] = config.userPassword || '';
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  // Handle empty responses (e.g., DELETE requests)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return {} as T;
};

// API Methods

// Users
export const getUsers = () => apiRequest('/users');
export const getUser = (id: number) => apiRequest(`/users/${id}`);
export const createUser = (data: any) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: number, data: any) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: number) => apiRequest(`/users/${id}`, { method: 'DELETE' });
export const searchUsers = (query: string) => apiRequest(`/users/search?q=${encodeURIComponent(query)}`);

// Groups
export const getGroups = () => apiRequest('/groups');
export const getGroup = (id: number) => apiRequest(`/groups/${id}`);
export const createGroup = (data: any) => apiRequest('/groups', { method: 'POST', body: JSON.stringify(data) });
export const updateGroup = (id: number, data: any) => apiRequest(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGroup = (id: number) => apiRequest(`/groups/${id}`, { method: 'DELETE' });

// Tasks
export const getUserTasks = (userId: number) => apiRequest(`/users/${userId}/tasks`);
export const createTask = (userId: number, data: any) => apiRequest(`/users/${userId}/tasks`, { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (userId: number, taskId: number, data: any) => apiRequest(`/users/${userId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (userId: number, taskId: number) => apiRequest(`/users/${userId}/tasks/${taskId}`, { method: 'DELETE' });
export const searchTasks = (query: string) => apiRequest(`/tasks/search?q=${encodeURIComponent(query)}`);
export const getTaskStats = () => apiRequest('/tasks/stats');
export const batchUpdateTasks = (data: any) => apiRequest('/tasks/batch', { method: 'POST', body: JSON.stringify(data) });
export const getTasksWithFilters = (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/tasks/filter?${queryString}`);
};

// Admin
export const adminSync = (action: 'force' | 'restore' | 'backup' = 'force') => 
  apiRequest(`/admin/sync?action=${action}`, { method: 'POST' });
export const getAdminStatus = () => apiRequest('/admin/status');
export const getAdminStats = () => apiRequest('/admin/stats');

// Health
export const healthCheck = () => apiRequest('/health', { requireAuth: false });
