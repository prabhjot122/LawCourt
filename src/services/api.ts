// API service for backend communication
const API_BASE_URL = 'http://localhost:5000';

// Types for API responses
export interface LoginResponse {
  message: string;
  session_token: string;
  user_role: string;
  is_admin: boolean;
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

export interface EditorAnalytics {
  content_stats: {
    blog_posts: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
    job_postings: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
    internships: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
    research_papers: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
    notes: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
    courses: { count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number };
  };
  total_views: number;
  engagement_metrics: {
    total_likes: number;
    total_shares: number;
    avg_time_spent: number;
    avg_bounce_rate: number;
  };
  applications: {
    total: number;
    pending: number;
    job_applications: number;
    internship_applications: number;
  };
  recent_content: Array<{
    Content_ID: number;
    Title: string;
    Content_Type: string;
    Status: string;
    Created_At: string;
    Updated_At: string;
    views: number;
    comments: number;
    applications: number;
  }>;
  trending_content: Array<{
    Content_ID: number;
    Title: string;
    Content_Type: string;
    Created_At: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    avg_time_spent: number;
    bounce_rate: number;
    engagement_score: number;
  }>;
  time_analytics: Array<{
    date: string;
    content_created: number;
    daily_views: number;
    daily_likes: number;
    daily_comments: number;
  }>;
}

export interface AdminAnalytics {
  global_content_stats: {
    blog_posts: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
    job_postings: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
    internships: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
    research_papers: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
    notes: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
    courses: { total_count: number; active_count: number; total_views: number; total_likes: number; total_shares: number; total_comments: number; avg_time_spent: number; avg_bounce_rate: number };
  };
  total_platform_views: number;
  role_based_stats: {
    [role: string]: {
      [contentType: string]: {
        count: number;
        total_views: number;
      };
    };
  };
  top_content: Array<{
    Content_ID: number;
    Title: string;
    Content_Type: string;
    Created_At: string;
    author_name: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagement_score: number;
  }>;
  top_creators: Array<{
    creator_name: string;
    User_ID: number;
    Role_Name: string;
    content_count: number;
    total_views: number;
    total_likes: number;
    last_activity: string;
  }>;
  moderation_metrics: {
    pending_content: number;
    banned_content: number;
    restricted_content: number;
    pending_research_reviews: number;
  };
  platform_trends: Array<{
    date: string;
    content_created: number;
    daily_views: number;
    daily_likes: number;
    daily_comments: number;
  }>;
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

export interface LikeResponse {
  success: boolean;
  action?: string;
  is_liked?: boolean;
  like_count?: number;
  message?: string;
}

export interface LikeStatusResponse {
  success: boolean;
  is_liked: boolean;
  like_count: number;
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
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
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

  // Content saving/bookmarking
  getSavedContent: async (params?: {
    content_type?: string;
    folder_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    saved_content: any[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.content_type) queryParams.append('content_type', params.content_type);
    if (params?.folder_id) queryParams.append('folder_id', params.folder_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    return apiClient.get(`/api/user/saved-content?${queryParams.toString()}`);
  },

  // User dashboard data
  getDashboardData: async (): Promise<{
    stats: {
      applications_submitted: { value: number; description: string };
      courses_enrolled: { value: number; description: string };
      blog_posts_read: { value: number; description: string };
      saved_jobs: { value: number; description: string };
    };
    recent_applications: Array<{
      id: number;
      position: string;
      company: string;
      status: string;
      applied_date: string;
      type: string;
    }>;
    upcoming_events: any[];
  }> => {
    return apiClient.get('/api/user/dashboard');
  },

  // Notifications
  getNotifications: async (params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }): Promise<{
    success: boolean;
    notifications: Array<{
      Notification_ID: number;
      User_ID: number;
      Type: string;
      Title: string;
      Message: string;
      Is_Read: boolean;
      Created_At: string;
      Related_Content_ID?: number;
      Action_URL?: string;
    }>;
    total: number;
    unread_count: number;
    limit: number;
    offset: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.unread_only) queryParams.append('unread_only', params.unread_only.toString());

    return apiClient.get(`/api/notifications?${queryParams.toString()}`);
  },

  markNotificationRead: async (notificationId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiClient.put('/api/notifications/read-all');
  },

  deleteNotification: async (notificationId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiClient.delete(`/api/notifications/${notificationId}`);
  },

  saveContent: async (data: { content_id: number; notes?: string }): Promise<{
    success: boolean;
    message: string;
    save_id: number;
  }> => {
    return apiClient.post('/api/user/save-content', data);
  },

  unsaveContent: async (contentId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiClient.delete(`/api/user/unsave-content/${contentId}`);
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

  getEnhancedAnalytics: async (): Promise<AdminAnalytics> => {
    return apiClient.get<AdminAnalytics>('/admin/analytics/enhanced');
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

// Editor API calls
export const editorApi = {
  getAnalytics: async (): Promise<EditorAnalytics> => {
    return apiClient.get<EditorAnalytics>('/api/editor/analytics');
  },

  getEnhancedAnalytics: async (): Promise<AdminAnalytics> => {
    return apiClient.get<AdminAnalytics>('/admin/analytics/enhanced');
  },

  getContentAnalytics: async (params?: {
    timeRange?: string;
    contentType?: string;
  }): Promise<{
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    topContent: Array<{
      content_id: number;
      title: string;
      content_type: string;
      views: number;
      likes: number;
      shares: number;
      comments: number;
      created_at: string;
      author_name: string;
    }>;
    contentByType: Array<{
      type: string;
      count: number;
      views: number;
    }>;
    dailyViews: Array<{
      date: string;
      views: number;
      likes: number;
    }>;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.timeRange) queryParams.append('timeRange', params.timeRange);
    if (params?.contentType) queryParams.append('contentType', params.contentType);

    const endpoint = `/api/content/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  },
};

// Content Management Types
export interface BlogPost {
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  category: string;
  allow_comments: boolean;
  is_published: boolean;
  publication_date: string;
  author_name: string;
  comment_count: number;
}

export interface ResearchPaper {
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  thumbnail_url?: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  authors: string;
  publication: string;
  publication_date: string;
  doi: string;
  keywords: string;
  abstract: string;
  citation_count: number;
  author_name: string;
  pdf_url?: string;
}

export interface Job {
  job_id: number;
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  company_name: string;
  location: string;
  job_type: string;
  salary_range: string;
  experience_required: string;
  eligibility_criteria: string;
  application_deadline: string;
  contact_email: string;
  contact_phone: string;
  job_is_featured: boolean;
  posted_by: string;
}

export interface Internship {
  internship_id: number;
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  company_name: string;
  location: string;
  internship_type: string;
  duration: string;
  stipend: string;
  eligibility_criteria: string;
  application_deadline: string;
  contact_email: string;
  contact_phone: string;
  internship_is_featured: boolean;
  posted_by: string;
}

export interface Course {
  course_id: number;
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  instructor: string;
  duration: string;
  start_date: string;
  end_date: string;
  enrollment_limit: number;
  current_enrollment: number;
  prerequisites: string;
  syllabus: string;
  author_name: string;
}

export interface Note {
  note_id: number;
  content_id: number;
  user_id: number;
  title: string;
  summary?: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: string;
  category: string;
  is_private: boolean;
  author_name: string;
  save_count?: number;
  view_count?: number;
  metric_save_count?: number;
  note_type?: 'created' | 'saved';
  original_author_name?: string;
  saved_at?: string;
  content_type?: 'text' | 'pdf';
  pdf_file_path?: string;
  pdf_file_size?: number;
}

export interface Comment {
  comment_id: number;
  content_id: number;
  user_id: number;
  comment_text: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  parent_comment_id?: number;
  author_name: string;
}

export interface JobApplication {
  Application_ID: number;
  Job_ID: number;
  User_ID?: number;
  Application_Date: string;
  Status: string;
  Company_Name: string;
  Job_Title: string;
  Location: string;
  Job_Type: string;
  Applicant_Name?: string;
  Applicant_Email?: string;
  Resume_URL?: string;
  Cover_Letter?: string;
}

export interface InternshipApplication {
  Application_ID: number;
  Internship_ID: number;
  User_ID?: number;
  Application_Date: string;
  Status: string;
  Company_Name: string;
  Internship_Title: string;
  Location: string;
  Internship_Type: string;
  Applicant_Name?: string;
  Applicant_Email?: string;
  Resume_URL?: string;
  Cover_Letter?: string;
}

// Content Management API calls
export const contentApi = {
  // Blog Posts
  getBlogPosts: async (params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ blog_posts: BlogPost[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/blog-posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ blog_posts: BlogPost[]; total: number }>(endpoint);
  },

  getBlogPost: async (id: number): Promise<{ blog_post: BlogPost; comments: Comment[] }> => {
    return apiClient.get<{ blog_post: BlogPost; comments: Comment[] }>(`/api/blog-posts/${id}`);
  },

  createBlogPost: async (data: {
    title: string;
    summary?: string;
    content: string;
    featured_image?: string;
    tags?: string;
    category?: string;
    allow_comments?: boolean;
    is_published?: boolean;
  }): Promise<{ message: string; content_id: number }> => {
    return apiClient.post<{ message: string; content_id: number }>('/api/blog-posts', data);
  },

  updateBlogPost: async (id: number, data: {
    title?: string;
    summary?: string;
    content?: string;
    featured_image?: string;
    tags?: string;
    category?: string;
    allow_comments?: boolean;
    is_published?: boolean;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/blog-posts/${id}`, data);
  },

  deleteBlogPost: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/blog-posts/${id}`);
  },

  // Research Papers
  getResearchPapers: async (params?: {
    keywords?: string;
    author?: string;
    page?: number;
    limit?: number;
  }): Promise<{ research_papers: ResearchPaper[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.keywords) queryParams.append('keywords', params.keywords);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/research-papers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ research_papers: ResearchPaper[]; total: number }>(endpoint);
  },

  getResearchPaper: async (id: number): Promise<{ research_paper: ResearchPaper }> => {
    return apiClient.get<{ research_paper: ResearchPaper }>(`/api/research-papers/${id}`);
  },

  createResearchPaper: async (data: {
    title: string;
    abstract: string;
    authors?: string;
    journal_name?: string;
    publication_date?: string;
    doi?: string;
    keywords?: string;
    category?: string;
    is_published?: boolean;
    pdf_url?: string;
    thumbnail_url?: string;
  }): Promise<{ message: string; content_id: number }> => {
    return apiClient.post<{ message: string; content_id: number }>('/api/research-papers', data);
  },

  updateResearchPaper: async (id: number, data: {
    title?: string;
    abstract?: string;
    authors?: string;
    journal_name?: string;
    publication_date?: string;
    doi?: string;
    keywords?: string;
    category?: string;
    is_published?: boolean;
    pdf_url?: string;
    thumbnail_url?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/research-papers/${id}`, data);
  },

  deleteResearchPaper: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/research-papers/${id}`);
  },

  // Jobs
  getJobs: async (params?: {
    location?: string;
    job_type?: string;
    experience_level?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobs: Job[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.location) queryParams.append('location', params.location);
    if (params?.job_type) queryParams.append('job_type', params.job_type);
    if (params?.experience_level) queryParams.append('experience_level', params.experience_level);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ jobs: Job[]; total: number }>(endpoint);
  },

  getJob: async (id: number): Promise<{ success: boolean; job: Job; has_applied: boolean; application: any }> => {
    return apiClient.get<{ success: boolean; job: Job; has_applied: boolean; application: any }>(`/api/jobs/${id}`);
  },

  createJob: async (data: {
    title: string;
    content: string;
    company_name: string;
    location: string;
    job_type: string;
    salary_range?: string;
    experience_level?: string;
    application_deadline: string;
    is_remote?: boolean;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string; job_id: number }> => {
    return apiClient.post<{ message: string; job_id: number }>('/api/jobs', data);
  },

  updateJob: async (id: number, data: {
    title?: string;
    content?: string;
    company_name?: string;
    location?: string;
    job_type?: string;
    salary_range?: string;
    experience_level?: string;
    application_deadline?: string;
    is_remote?: boolean;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/jobs/${id}`, data);
  },

  deleteJob: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/jobs/${id}`);
  },

  // Internships
  getInternships: async (params?: {
    location?: string;
    internship_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ internships: Internship[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.location) queryParams.append('location', params.location);
    if (params?.internship_type) queryParams.append('internship_type', params.internship_type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/internships${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ internships: Internship[]; total: number }>(endpoint);
  },

  getInternship: async (id: number): Promise<{ success: boolean; internship: Internship; has_applied: boolean; application: any }> => {
    return apiClient.get<{ success: boolean; internship: Internship; has_applied: boolean; application: any }>(`/api/internships/${id}`);
  },

  createInternship: async (data: {
    title: string;
    content: string;
    company_name: string;
    location: string;
    internship_type: string;
    duration: string;
    stipend?: string;
    application_deadline: string;
    requirements?: string;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string; internship_id: number }> => {
    return apiClient.post<{ message: string; internship_id: number }>('/api/internships', data);
  },

  updateInternship: async (id: number, data: {
    title?: string;
    content?: string;
    company_name?: string;
    location?: string;
    internship_type?: string;
    duration?: string;
    stipend?: string;
    application_deadline?: string;
    requirements?: string;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/internships/${id}`, data);
  },

  deleteInternship: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/internships/${id}`);
  },

  // Notes - Public Discovery
  getNotes: async (params?: {
    search?: string;
    category?: string;
    author?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: 'recent' | 'popular' | 'saved';
    page?: number;
    limit?: number;
  }): Promise<{ notes: Note[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ notes: Note[]; total: number }>(endpoint);
  },

  // Notes - Personal Library
  getUserNotesLibrary: async (params?: {
    type?: 'all' | 'created' | 'saved';
    page?: number;
    limit?: number;
  }): Promise<{ notes: Note[]; total: number; library_type: string }> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/notes/library${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ notes: Note[]; total: number; library_type: string }>(endpoint);
  },

  // Save a public note to user's library
  saveNoteToLibrary: async (noteId: number): Promise<{ message: string; saved_note_id: number }> => {
    return apiClient.post<{ message: string; saved_note_id: number }>(`/api/notes/${noteId}/save`, {});
  },

  getNote: async (id: number): Promise<{ note: Note }> => {
    return apiClient.get<{ note: Note }>(`/api/notes/${id}`);
  },

  createNote: async (data: {
    title: string;
    content?: string;
    category?: string;
    is_private?: boolean;
    content_type?: 'text' | 'pdf';
    pdf_file_path?: string;
    pdf_file_size?: number;
    extracted_text?: string;
  }): Promise<{ message: string; content_id: number }> => {
    return apiClient.post<{ message: string; content_id: number }>('/api/notes', data);
  },

  updateNote: async (id: number, data: {
    title?: string;
    content?: string;
    category?: string;
    is_private?: boolean;
    content_type?: 'text' | 'pdf';
    pdf_file_path?: string;
    pdf_file_size?: number;
    extracted_text?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/notes/${id}`, data);
  },

  deleteNote: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/notes/${id}`);
  },

  // Courses
  getCourses: async (params?: {
    instructor?: string;
    page?: number;
    limit?: number;
  }): Promise<{ courses: Course[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.instructor) queryParams.append('instructor', params.instructor);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ courses: Course[]; total: number }>(endpoint);
  },

  getCourse: async (id: number): Promise<{ course: Course }> => {
    return apiClient.get<{ course: Course }>(`/api/courses/${id}`);
  },

  createCourse: async (data: {
    title: string;
    content: string;
    instructor: string;
    duration: string;
    start_date: string;
    end_date: string;
    enrollment_limit: number;
    prerequisites?: string;
    syllabus?: string;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string; course_id: number }> => {
    return apiClient.post<{ message: string; course_id: number }>('/api/courses', data);
  },

  updateCourse: async (id: number, data: {
    title?: string;
    content?: string;
    instructor?: string;
    duration?: string;
    start_date?: string;
    end_date?: string;
    enrollment_limit?: number;
    prerequisites?: string;
    syllabus?: string;
    summary?: string;
    tags?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/courses/${id}`, data);
  },

  deleteCourse: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/courses/${id}`);
  },

  // Comments
  addComment: async (contentId: number, commentText: string): Promise<{ message: string; comment_id: number }> => {
    return apiClient.post<{ message: string; comment_id: number }>(`/api/content/${contentId}/comments`, {
      comment_text: commentText
    });
  },

  deleteComment: async (commentId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/comments/${commentId}`);
  },

  // Job Applications
  applyForJob: async (jobId: number, data: {
    resume_url: string;
    cover_letter?: string;
  }): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/api/jobs/${jobId}/apply`, data);
  },

  getUserJobApplications: async (): Promise<{ applications: JobApplication[] }> => {
    return apiClient.get<{ applications: JobApplication[] }>('/api/user/applications/jobs');
  },

  getEditorJobApplications: async (): Promise<{ applications: JobApplication[] }> => {
    return apiClient.get<{ applications: JobApplication[] }>('/api/editor/applications/jobs');
  },

  updateJobApplicationStatus: async (applicationId: number, data: {
    status: string;
    notes?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/job-applications/${applicationId}/status`, data);
  },

  // Internship Applications
  applyForInternship: async (internshipId: number, data: {
    resume_url: string;
    cover_letter?: string;
  }): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/api/internships/${internshipId}/apply`, data);
  },

  getUserInternshipApplications: async (): Promise<{ applications: InternshipApplication[] }> => {
    return apiClient.get<{ applications: InternshipApplication[] }>('/api/user/applications/internships');
  },

  getEditorInternshipApplications: async (): Promise<{ applications: InternshipApplication[] }> => {
    return apiClient.get<{ applications: InternshipApplication[] }>('/api/editor/applications/internships');
  },

  updateInternshipApplicationStatus: async (applicationId: number, data: {
    status: string;
    notes?: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/api/internship-applications/${applicationId}/status`, data);
  },

  // Admin Application Management
  getAllApplications: async (params?: {
    type?: 'jobs' | 'internships' | 'all';
    status?: string;
    company?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: any[]; total: number; limit: number; offset: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    return apiClient.get<{ applications: any[]; total: number; limit: number; offset: number }>(`/api/admin/applications?${queryParams}`);
  },

  // Editor Application Management (duplicates removed - using properly typed versions above)

  // Research Paper Application Management
  getUserResearchPaperApplications: async (): Promise<{ applications: any[] }> => {
    return apiClient.get<{ applications: any[] }>('/api/user/applications/research-papers');
  },

  getAllResearchPaperApplications: async (params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: any[]; total: number; limit: number; offset: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    return apiClient.get<{ applications: any[]; total: number; limit: number; offset: number }>(`/api/admin/applications/research-papers?${queryParams}`);
  },

  updateResearchPaperApplicationStatus: async (contentId: number, data: { status: string; comments?: string }): Promise<{ success: boolean; message: string }> => {
    return apiClient.put(`/api/admin/research-papers/${contentId}/review`, data);
  },

  // Research paper review workflow
  submitResearchPaperForReview: async (data: {
    title: string;
    abstract: string;
    authors: string;
    journal_name?: string;
    publication_date?: string;
    doi?: string;
    keywords?: string;
    pdf_url?: string;
  }): Promise<{
    success: boolean;
    message: string;
    content_id: number;
  }> => {
    return apiClient.post('/api/research-papers/submit-for-review', data);
  },

  getPendingResearchPapers: async (): Promise<{
    success: boolean;
    pending_papers: any[];
  }> => {
    return apiClient.get('/api/research-papers/pending-reviews');
  },

  reviewResearchPaper: async (contentId: number, data: {
    action: 'approve' | 'reject' | 'request_revision';
    comments?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiClient.post(`/api/research-papers/${contentId}/review`, data);
  },

  // Grammar Checker API
  checkGrammar: async (text: string): Promise<{
    success: boolean;
    issues: Array<{
      offset: number;
      length: number;
      message: string;
      short_message: string;
      issue_type: string;
      rule_id: string;
      replacements: string[];
      context: string;
      sentence: string;
    }>;
    statistics: {
      total_issues: number;
      by_type: Record<string, number>;
      severity_distribution: Record<string, number>;
    };
    text_length: number;
    word_count: number;
    error?: string;
  }> => {
    return apiClient.post('/api/grammar/check', { text });
  },

  applySuggestion: async (text: string, offset: number, length: number, replacement: string): Promise<{
    success: boolean;
    corrected_text: string;
    error?: string;
  }> => {
    return apiClient.post('/api/grammar/apply-suggestion', {
      text,
      offset,
      length,
      replacement
    });
  },

  checkGrammarHealth: async (): Promise<{
    success: boolean;
    service_available: boolean;
    message: string;
    error?: string;
  }> => {
    return apiClient.get('/api/grammar/health');
  },

  // Like System API
  likeContent: async (contentId: number): Promise<LikeResponse> => {
    return apiClient.post<LikeResponse>(`/api/content/${contentId}/like`);
  },

  getLikeStatus: async (contentId: number): Promise<LikeStatusResponse> => {
    return apiClient.get<LikeStatusResponse>(`/api/content/${contentId}/like-status`);
  },
};

export default apiClient;
