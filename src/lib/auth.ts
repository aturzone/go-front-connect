// Authentication and Role Management

export type UserRole = 'owner' | 'group-admin' | 'user';

export interface UserAuth {
  role: UserRole;
  userId?: number;
  groupId?: number;
  email?: string;
}

const AUTH_KEY = 'gask_user_auth';

// Get current user authentication info
export const getUserAuth = (): UserAuth | null => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Save user authentication info
export const saveUserAuth = (auth: UserAuth): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
};

// Clear user authentication
export const clearUserAuth = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

// Check if user has specific role (exact match only)
export const hasRole = (role: UserRole): boolean => {
  const auth = getUserAuth();
  return auth?.role === role;
};

// Check if user has specific role or higher
export const hasRoleOrHigher = (role: UserRole): boolean => {
  const auth = getUserAuth();
  if (!auth) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    'owner': 3,
    'group-admin': 2,
    'user': 1,
  };
  
  return roleHierarchy[auth.role] >= roleHierarchy[role];
};

// Check if owner
export const isOwner = (): boolean => {
  return hasRole('owner');
};

// Check if group admin
export const isGroupAdmin = (): boolean => {
  return hasRole('group-admin');
};

// Check if regular user
export const isUser = (): boolean => {
  return hasRole('user');
};

// Check if has access to admin features
export const canAccessAdmin = (): boolean => {
  return isOwner();
};

// Check if can manage all groups
export const canManageAllGroups = (): boolean => {
  return isOwner();
};

// Check if can manage specific group
export const canManageGroup = (groupId: number): boolean => {
  const auth = getUserAuth();
  if (isOwner()) return true;
  if (isGroupAdmin() && auth?.groupId === groupId) return true;
  return false;
};

// Check if can view all tasks
export const canViewAllTasks = (): boolean => {
  return isOwner();
};

// Check if can view all users
export const canViewAllUsers = (): boolean => {
  return isOwner();
};
