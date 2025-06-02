import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, userApi, getSessionToken, setSessionToken, removeSessionToken } from '@/services/api';

// Define user roles
export enum UserRole {
  USER = 'User',
  EDITOR = 'Editor',
  ADMIN = 'Admin',
}

// Map backend role IDs to frontend roles
const mapRoleIdToRole = (roleId: number, roleName?: string): UserRole => {
  switch (roleId) {
    case 1:
      return UserRole.ADMIN;
    case 2:
      return UserRole.EDITOR;
    case 3:
    default:
      return UserRole.USER;
  }
};

// Define user interface
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  bio: string;
  practiceArea: string;
  organization: string; // This will be mapped from alumni_of or professional_organizations
  role: UserRole;
  roleId: number;
  profilePhoto?: string;
  lawSpecialization?: string;
  education?: string;
  barExamStatus?: 'Passed' | 'Pending' | 'Not Applicable';
  licenseNumber?: string;
  location?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  alumniInformation?: string;
  professionalMemberships?: string;
  status?: string;
}

// Define signup data interface
export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  bio: string;
  practiceArea: string;
  organization: string;
  lawSpecialization?: string;
  education?: string;
  barExamStatus?: 'Passed' | 'Pending' | 'Not Applicable';
  licenseNumber?: string;
  location?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  alumniInformation?: string;
  professionalMemberships?: string;
}

// Define permission types
export enum Permission {
  // Admin permissions
  CONTENT_CREATE_ALL = 'content_create_all',
  CONTENT_READ_ALL = 'content_read_all',
  CONTENT_UPDATE_ALL = 'content_update_all',
  CONTENT_DELETE_ALL = 'content_delete_all',
  CONTENT_MODERATE = 'content_moderate',
  USER_MANAGE = 'user_manage',
  SYSTEM_ADMIN = 'system_admin',

  // Editor permissions
  CONTENT_CREATE_OWN = 'content_create_own',
  CONTENT_UPDATE_OWN = 'content_update_own',
  CONTENT_DELETE_OWN = 'content_delete_own',
  CONTENT_PUBLISH_OWN = 'content_publish_own',
  METRICS_VIEW_OWN = 'metrics_view_own',
  RESEARCH_REVIEW = 'research_review',
  JOB_CREATE = 'job_create',

  // User permissions
  CONTENT_READ_PUBLIC = 'content_read_public',
  BLOG_COMMENT = 'blog_comment',
  JOB_APPLY = 'job_apply',
  INTERNSHIP_APPLY = 'internship_apply',
  CONTENT_SAVE = 'content_save',
  CONTENT_COPY = 'content_copy',
  RESEARCH_SUBMIT = 'research_submit',
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  googleAuth: (token: string) => Promise<{ success: boolean; requiresProfileCompletion?: boolean; userId?: number }>;
  completeOAuthProfile: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  requestEditorAccess: () => Promise<boolean>;
  hasPermission: (permission: Permission, contentOwnerId?: string) => boolean;
  canCreateContent: () => boolean;
  canEditContent: (contentOwnerId?: string) => boolean;
  canDeleteContent: (contentOwnerId?: string) => boolean;
  canModerateContent: () => boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map backend user data to frontend User interface
const mapBackendUserToFrontend = (backendUser: any): User => {
  return {
    id: backendUser.id,
    email: backendUser.email,
    fullName: backendUser.full_name,
    phoneNumber: backendUser.phone,
    bio: backendUser.bio,
    practiceArea: backendUser.practice_area,
    organization: backendUser.alumni_of || backendUser.professional_organizations || 'Not specified',
    role: mapRoleIdToRole(backendUser.role_id, backendUser.role_name),
    roleId: backendUser.role_id,
    profilePhoto: backendUser.profile_pic,
    lawSpecialization: backendUser.law_specialization,
    education: backendUser.education,
    barExamStatus: backendUser.bar_exam_status as 'Passed' | 'Pending' | 'Not Applicable',
    licenseNumber: backendUser.license_number,
    location: backendUser.location,
    yearsOfExperience: backendUser.years_of_experience,
    linkedinUrl: backendUser.linkedin_profile,
    alumniInformation: backendUser.alumni_of,
    professionalMemberships: backendUser.professional_organizations,
    status: backendUser.status,
  };
};

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for saved session on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const sessionToken = getSessionToken();
      if (sessionToken) {
        try {
          // Validate session and get user profile
          const sessionValid = await authApi.validateSession();
          if (sessionValid.valid) {
            const userProfile = await userApi.getProfile();
            const mappedUser = mapBackendUserToFrontend(userProfile.user);
            setUser(mappedUser);
            setIsAuthenticated(true);
          } else {
            // Invalid session, remove token
            removeSessionToken();
          }
        } catch (error) {
          console.error('Error validating session:', error);
          // If it's a 401 error, the session is invalid
          if (error instanceof Error && error.message.includes('401')) {
            console.log('Session expired or invalid, clearing token');
          }
          removeSessionToken();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);

      // Store session token
      setSessionToken(response.session_token);

      // Get user profile
      const userProfile = await userApi.getProfile();
      const mappedUser = mapBackendUserToFrontend(userProfile.user);

      // Ensure admin role is properly set
      if (response.is_admin) {
        mappedUser.role = UserRole.ADMIN;
      }

      setUser(mappedUser);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Signup function
  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      // Map frontend data to backend format
      const backendData = {
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        phone: userData.phoneNumber || '',
        bio: userData.bio,
        profile_pic: '', // Default empty, can be updated later
        law_specialization: userData.lawSpecialization || '',
        education: userData.education || '',
        bar_exam_status: userData.barExamStatus || 'Not Applicable',
        license_number: userData.licenseNumber || '',
        practice_area: userData.practiceArea,
        location: userData.location || '',
        years_of_experience: userData.yearsOfExperience || 0,
        linkedin_profile: userData.linkedinUrl || '',
        alumni_of: userData.alumniInformation || userData.organization,
        professional_organizations: userData.professionalMemberships || '',
      };

      await authApi.register(backendData);

      // Auto login after successful signup
      const loginSuccess = await login(userData.email, userData.password);
      return loginSuccess;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const sessionToken = getSessionToken();
      if (sessionToken) {
        await authApi.logout(sessionToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      removeSessionToken();
      navigate('/login');
    }
  };

  // Update user function (for local state updates)
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  // Google OAuth function
  const googleAuth = async (token: string): Promise<{ success: boolean; requiresProfileCompletion?: boolean; userId?: number }> => {
    try {
      const response = await authApi.googleAuth(token);

      // Store session token
      setSessionToken(response.session_token);

      if (response.requires_profile_completion) {
        // User needs to complete profile
        return {
          success: true,
          requiresProfileCompletion: true,
          userId: response.user_id
        };
      } else {
        // Get user profile for existing users
        const userProfile = await userApi.getProfile();
        const mappedUser = mapBackendUserToFrontend(userProfile.user);

        // Ensure admin role is properly set
        if (response.is_admin) {
          mappedUser.role = UserRole.ADMIN;
        }

        setUser(mappedUser);
        setIsAuthenticated(true);

        return { success: true };
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false };
    }
  };

  // Complete OAuth profile function
  const completeOAuthProfile = async (userData: any): Promise<boolean> => {
    try {
      await authApi.completeOAuthProfile(userData);

      // Get updated user profile
      const userProfile = await userApi.getProfile();
      const mappedUser = mapBackendUserToFrontend(userProfile.user);

      setUser(mappedUser);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Complete OAuth profile error:', error);
      return false;
    }
  };

  // Request editor access function
  const requestEditorAccess = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await userApi.requestEditorAccess(parseInt(user.id));
      return true;
    } catch (error) {
      console.error('Request editor access error:', error);
      return false;
    }
  };

  // Permission checking functions
  const hasPermission = (permission: Permission, contentOwnerId?: string): boolean => {
    if (!user) return false;

    // Super admin or admin role has all permissions
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Define role-based permissions
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.ADMIN]: Object.values(Permission), // All permissions
      [UserRole.EDITOR]: [
        Permission.CONTENT_CREATE_OWN,
        Permission.CONTENT_READ_PUBLIC,
        Permission.CONTENT_UPDATE_OWN,
        Permission.CONTENT_DELETE_OWN,
        Permission.CONTENT_PUBLISH_OWN,
        Permission.METRICS_VIEW_OWN,
        Permission.RESEARCH_REVIEW,
        Permission.JOB_CREATE,
        Permission.BLOG_COMMENT,
        Permission.CONTENT_SAVE,
        Permission.CONTENT_COPY,
        Permission.RESEARCH_SUBMIT,
        Permission.JOB_APPLY,
        Permission.INTERNSHIP_APPLY,
      ],
      [UserRole.USER]: [
        Permission.CONTENT_READ_PUBLIC,
        Permission.BLOG_COMMENT,
        Permission.JOB_APPLY,
        Permission.INTERNSHIP_APPLY,
        Permission.CONTENT_SAVE,
        Permission.CONTENT_COPY,
        Permission.RESEARCH_SUBMIT,
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];

    // Check if user has the exact permission
    if (userPermissions.includes(permission)) {
      // For "own" permissions, check ownership
      if (permission.includes('_own') && contentOwnerId) {
        return user.id === contentOwnerId;
      }
      return true;
    }

    // Check for hierarchical permissions
    if (user.role === UserRole.ADMIN) {
      // Admin has all permissions
      return true;
    }

    if (user.role === UserRole.EDITOR) {
      // Editor can do "own" operations if they own the content
      if (permission.includes('_own') && contentOwnerId && user.id === contentOwnerId) {
        return true;
      }
    }

    return false;
  };

  const canCreateContent = (): boolean => {
    return hasPermission(Permission.CONTENT_CREATE_OWN) || hasPermission(Permission.CONTENT_CREATE_ALL);
  };

  const canEditContent = (contentOwnerId?: string): boolean => {
    return hasPermission(Permission.CONTENT_UPDATE_ALL) ||
           (hasPermission(Permission.CONTENT_UPDATE_OWN) && contentOwnerId && user?.id === contentOwnerId);
  };

  const canDeleteContent = (contentOwnerId?: string): boolean => {
    return hasPermission(Permission.CONTENT_DELETE_ALL) ||
           (hasPermission(Permission.CONTENT_DELETE_OWN) && contentOwnerId && user?.id === contentOwnerId);
  };

  const canModerateContent = (): boolean => {
    return hasPermission(Permission.CONTENT_MODERATE);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        googleAuth,
        completeOAuthProfile,
        logout,
        updateUser,
        requestEditorAccess,
        hasPermission,
        canCreateContent,
        canEditContent,
        canDeleteContent,
        canModerateContent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

