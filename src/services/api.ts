// API service for backend communication
const API_BASE_URL = 'http://localhost:5000';

// Types for API responses
export interface LoginResponse {
  message: string;
  session_token: string;
}

export interface RegisterResponse {
  message: string;
}

export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    role_id: number;
    role_name: string;
    status: string;
    full_name: string;
    phone: string;
    bio: string;
    profile_pic: string;
    law_specialization: string;
    education: string;
    bar_exam_status: string;
    license_number: string;
    practice_area: string;
    location: string;
    years_of_experience: number;
    linkedin_profile: string;
    alumni_of: string;
    professional_organizations: string;
  };
}

export interface AccessRequest {
  request_id: number;
  user_id: number;
  full_name: string;
  practice_area: string;
  requested_at: string;
  status: string;
}

export interface AccessRequestsResponse {
  access_requests: AccessRequest[];
}

export interface User {
  user_id: number;
  email: string;
  role_id: number;
  status: string;
  created_at: string;
  full_name: string;
  phone?: string;
  bio?: string;
  practice_area: string;
  location: string;
  years_of_experience: number;
  role_name: string;
  is_active: boolean;
}

export interface UsersResponse {
  users: User[];
}

export interface Analytics {
  role_counts: { role: string; count: number }[];
  active_users: number;
  total_users: number;
  pending_requests: number;
  monthly_registrations: { month: string; count: number }[];
}

export interface AuditLog {
  log_id: number;
  admin_id: number;
  action_type: string;
  action_details: string;
  timestamp: string;
  admin_name: string;
}

export interface AuditLogsResponse {
  audit_logs: AuditLog[];
}

export interface ApiError {
  error: string;
}

// Session token management
export const getSessionToken = (): string | null => {
  return localStorage.getItem('session_token');
};

export const setSessionToken = (token: string): void => {
  localStorage.setItem('session_token', token);
};

export const removeSessionToken = (): void => {
  localStorage.removeItem('session_token');
};

// HTTP client with error handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if session token exists
    const sessionToken = getSessionToken();
    if (sessionToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${sessionToken}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Authentication API calls
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/login', { email, password });
  },

  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    bio: string;
    profile_pic: string;
    law_specialization: string;
    education: string;
    bar_exam_status: string;
    license_number: string;
    practice_area: string;
    location: string;
    years_of_experience: number;
    linkedin_profile: string;
    alumni_of: string;
    professional_organizations: string;
  }): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>('/register', userData);
  },

  googleAuth: async (token: string): Promise<{
    message: string;
    session_token: string;
    user_role: string;
    is_admin: boolean;
    profile_complete: boolean;
    user_id: number;
    requires_profile_completion?: boolean;
  }> => {
    return apiClient.post('/auth/google', { token });
  },

  completeOAuthProfile: async (userData: {
    user_id: number;
    bio: string;
    practice_area: string;
    bar_exam_status: string;
    phone?: string;
    law_specialization?: string;
    education?: string;
    license_number?: string;
    location?: string;
    years_of_experience?: number;
    linkedin_profile?: string;
    alumni_of?: string;
    professional_organizations?: string;
  }): Promise<{ message: string }> => {
    return apiClient.post('/auth/complete-profile', userData);
  },

  logout: async (sessionToken: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/logout', { session_token: sessionToken });
  },

  validateSession: async (): Promise<{ valid: boolean; user_id?: number }> => {
    return apiClient.get<{ valid: boolean; user_id?: number }>('/user/validate_session');
  },
};

// User API calls
export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    return apiClient.get<UserProfileResponse>('/user/profile');
  },

  requestEditorAccess: async (userId: number): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/request_editor_access', { user_id: userId });
  },
};

// Admin API calls
export const adminApi = {
  getAccessRequests: async (): Promise<AccessRequestsResponse> => {
    return apiClient.get<AccessRequestsResponse>('/admin/access_requests');
  },

  approveOrDenyAccess: async (
    requestId: number,
    action: 'Approve' | 'Deny',
    adminId: number
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/approve_deny_access', {
      request_id: requestId,
      action,
      admin_id: adminId,
    });
  },

  getAllUsers: async (): Promise<UsersResponse> => {
    return apiClient.get<UsersResponse>('/admin/users');
  },

  getAnalytics: async (): Promise<Analytics> => {
    return apiClient.get<Analytics>('/admin/analytics');
  },

  getAuditLogs: async (): Promise<AuditLogsResponse> => {
    return apiClient.get<AuditLogsResponse>('/admin/audit_logs');
  },

  updateUserRole: async (
    userId: number,
    roleId: number,
    adminId: number
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/update_user_role', {
      user_id: userId,
      role_id: roleId,
      admin_id: adminId,
    });
  },

  updateUserStatus: async (
    userId: number,
    status: string,
    adminId: number
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/update_user_status', {
      user_id: userId,
      status,
      admin_id: adminId,
    });
  },

  updateUserProfile: async (
    userId: number,
    profileData: {
      full_name?: string;
      email?: string;
      phone?: string;
      bio?: string;
      practice_area?: string;
      location?: string;
      years_of_experience?: number;
    },
    adminId: number
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/update_user_profile', {
      user_id: userId,
      profile_data: profileData,
      admin_id: adminId,
    });
  },

  createUser: async (
    userData: {
      email: string;
      password: string;
      role_id: number;
      profile_data?: {
        full_name?: string;
        phone?: string;
        bio?: string;
        practice_area?: string;
        location?: string;
        years_of_experience?: number;
        law_specialization?: string;
        education?: string;
        bar_exam_status?: string;
        license_number?: string;
        linkedin_profile?: string;
        alumni_of?: string;
        professional_organizations?: string;
      };
    },
    adminId: number
  ): Promise<{ message: string; user_id: number }> => {
    return apiClient.post<{ message: string; user_id: number }>('/admin/create_user', {
      ...userData,
      admin_id: adminId,
    });
  },

  changeUserPassword: async (
    userId: number,
    newPassword: string,
    adminId: number
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/admin/change_password', {
      user_id: userId,
      new_password: newPassword,
      admin_id: adminId,
    });
  },

  // Email management
  sendEmail: async (
    adminId: number,
    recipientUserIds: number[],
    subject: string,
    content: string,
    emailType: string = 'announcement'
  ): Promise<{ message: string; recipients_count: number }> => {
    return apiClient.post('/admin/send_email', {
      admin_id: adminId,
      recipient_user_ids: recipientUserIds,
      subject,
      content,
      email_type: emailType,
    });
  },

  getEmailLogs: async (): Promise<{
    email_logs: Array<{
      email_id: number;
      sender_id: number;
      sender_name: string;
      recipient_count: number;
      subject: string;
      email_type: string;
      status: string;
      sent_at: string;
    }>;
  }> => {
    return apiClient.get('/admin/email_logs');
  },

  getUsersForEmail: async (): Promise<{
    users: Array<{
      user_id: number;
      email: string;
      full_name: string;
      practice_area: string;
      role_name: string;
      status: string;
    }>;
  }> => {
    return apiClient.get('/admin/users_for_email');
  },
};

export default apiClient;
