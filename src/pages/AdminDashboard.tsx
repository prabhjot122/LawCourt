import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { adminApi, AccessRequest, User, Analytics, AuditLog } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX,
  Search, BarChart3, Activity, Shield, TrendingUp, Calendar,
  Eye, Edit, Settings, Ban, Play, Pause, Save, X, Plus, Key, UserPlus,
  Mail, Send, MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import AuthHeader from '@/components/AuthHeader';
import Footer from '@/components/Footer';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for different data types
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailUsers, setEmailUsers] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [emailUsersLoading, setEmailUsersLoading] = useState(false);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Processing states
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());
  const [updatingUserRoles, setUpdatingUserRoles] = useState<Set<number>>(new Set());
  const [updatingUserStatus, setUpdatingUserStatus] = useState<Set<number>>(new Set());
  const [updatingUserProfile, setUpdatingUserProfile] = useState<Set<number>>(new Set());

  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Dialog states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);

  // Form states for user editing
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    practice_area: '',
    location: '',
    years_of_experience: 0
  });

  // Form states for user creation
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role_id: 3,
    full_name: '',
    phone: '',
    bio: '',
    practice_area: '',
    location: '',
    years_of_experience: 0,
    law_specialization: '',
    education: '',
    bar_exam_status: 'Not Applicable',
    license_number: '',
    linkedin_profile: '',
    alumni_of: '',
    professional_organizations: ''
  });

  // Form states for password change
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Form states for email sending
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    emailType: 'announcement'
  });

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchAccessRequests(),
      fetchAnalytics(),
    ]);
    setIsLoading(false);
  };

  const fetchAccessRequests = async () => {
    try {
      const response = await adminApi.getAccessRequests();
      setAccessRequests(response.access_requests);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch access requests',
        variant: 'destructive',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminApi.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await adminApi.getAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        variant: 'destructive',
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      const response = await adminApi.getAuditLogs();
      setAuditLogs(response.audit_logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const handleApproveOrDeny = async (requestId: number, action: 'Approve' | 'Deny') => {
    if (!user) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));

      await adminApi.approveOrDenyAccess(requestId, action, parseInt(user.id));

      // Remove the processed request from the list and refresh analytics
      setAccessRequests(prev => prev.filter(req => req.request_id !== requestId));
      fetchAnalytics();

      toast({
        title: 'Success',
        description: `Access request ${action.toLowerCase()}d successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing request:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action.toLowerCase()} access request`,
        variant: 'destructive',
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleUpdateUserRole = async (userId: number, newRoleId: number) => {
    if (!user) return;

    try {
      setUpdatingUserRoles(prev => new Set(prev).add(userId));

      await adminApi.updateUserRole(userId, newRoleId, parseInt(user.id));

      // Update the user in the local state
      setUsers(prev => prev.map(u =>
        u.user_id === userId
          ? { ...u, role_id: newRoleId, role_name: getRoleName(newRoleId) }
          : u
      ));

      // Refresh analytics to reflect role changes
      fetchAnalytics();

      toast({
        title: 'Success',
        description: 'User role updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUpdateUserStatus = async (userId: number, newStatus: string) => {
    if (!user) return;

    try {
      setUpdatingUserStatus(prev => new Set(prev).add(userId));

      await adminApi.updateUserStatus(userId, newStatus, parseInt(user.id));

      // Update the user in the local state
      setUsers(prev => prev.map(u =>
        u.user_id === userId
          ? { ...u, status: newStatus }
          : u
      ));

      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      practice_area: user.practice_area || '',
      location: user.location || '',
      years_of_experience: user.years_of_experience || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUserProfile = async () => {
    if (!user || !editingUser) return;

    try {
      setUpdatingUserProfile(prev => new Set(prev).add(editingUser.user_id));

      await adminApi.updateUserProfile(editingUser.user_id, editForm, parseInt(user.id));

      // Update the user in the local state
      setUsers(prev => prev.map(u =>
        u.user_id === editingUser.user_id
          ? {
              ...u,
              full_name: editForm.full_name,
              email: editForm.email,
              phone: editForm.phone,
              bio: editForm.bio,
              practice_area: editForm.practice_area,
              location: editForm.location,
              years_of_experience: editForm.years_of_experience
            }
          : u
      ));

      setIsEditDialogOpen(false);
      setEditingUser(null);

      toast({
        title: 'Success',
        description: 'User profile updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user profile',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserProfile(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingUser.user_id);
        return newSet;
      });
    }
  };

  const getRoleName = (roleId: number): string => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Editor';
      case 3: return 'User';
      default: return 'User';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'suspended': return 'bg-red-500';
      case 'banned': return 'bg-red-700';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'inactive': return <Pause className="h-3 w-3" />;
      case 'suspended': return <Ban className="h-3 w-3" />;
      case 'banned': return <X className="h-3 w-3" />;
      default: return <Pause className="h-3 w-3" />;
    }
  };

  const handleCreateUser = async () => {
    if (!user) return;

    // Validation
    if (!createUserForm.email || !createUserForm.password) {
      toast({
        title: 'Error',
        description: 'Email and password are required',
        variant: 'destructive',
      });
      return;
    }

    if (createUserForm.password !== createUserForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (createUserForm.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { confirmPassword, ...userData } = createUserForm;
      const { email, password, role_id, ...profileData } = userData;

      await adminApi.createUser(
        {
          email,
          password,
          role_id,
          profile_data: Object.keys(profileData).reduce((acc, key) => {
            const value = profileData[key as keyof typeof profileData];
            if (value !== '' && value !== 0) {
              acc[key as keyof typeof profileData] = value;
            }
            return acc;
          }, {} as any)
        },
        parseInt(user.id)
      );

      // Refresh users list
      fetchUsers();
      fetchAnalytics();

      // Reset form and close dialog
      setCreateUserForm({
        email: '',
        password: '',
        confirmPassword: '',
        role_id: 3,
        full_name: '',
        phone: '',
        bio: '',
        practice_area: '',
        location: '',
        years_of_experience: 0,
        law_specialization: '',
        education: '',
        bar_exam_status: 'Not Applicable',
        license_number: '',
        linkedin_profile: '',
        alumni_of: '',
        professional_organizations: ''
      });
      setIsCreateUserDialogOpen(false);

      toast({
        title: 'Success',
        description: 'User created successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = (user: User) => {
    setPasswordChangeUser(user);
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangePasswordDialogOpen(true);
  };

  const handleSavePassword = async () => {
    if (!user || !passwordChangeUser) return;

    // Validation
    if (!passwordForm.newPassword) {
      toast({
        title: 'Error',
        description: 'New password is required',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.changeUserPassword(
        passwordChangeUser.user_id,
        passwordForm.newPassword,
        parseInt(user.id)
      );

      setIsChangePasswordDialogOpen(false);
      setPasswordChangeUser(null);

      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
    }
  };

  // Email management functions
  const fetchEmailUsers = async () => {
    try {
      setEmailUsersLoading(true);
      const response = await adminApi.getUsersForEmail();
      setEmailUsers(response.users);
    } catch (error) {
      console.error('Error fetching email users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users for email',
        variant: 'destructive',
      });
    } finally {
      setEmailUsersLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setEmailLogsLoading(true);
      const response = await adminApi.getEmailLogs();
      setEmailLogs(response.email_logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email logs',
        variant: 'destructive',
      });
    } finally {
      setEmailLogsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!user || selectedUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    if (!emailForm.subject || !emailForm.content) {
      toast({
        title: 'Error',
        description: 'Subject and content are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSendingEmail(true);

      const response = await adminApi.sendEmail(
        parseInt(user.id),
        selectedUsers,
        emailForm.subject,
        emailForm.content,
        emailForm.emailType
      );

      toast({
        title: 'Success',
        description: `Email sent successfully to ${response.recipients_count} recipients`,
        variant: 'default',
      });

      // Reset form and close dialog
      setEmailForm({
        subject: '',
        content: '',
        emailType: 'announcement'
      });
      setSelectedUsers([]);
      setIsSendEmailDialogOpen(false);

      // Refresh email logs
      fetchEmailLogs();

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(emailUsers.map(user => user.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role_name.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if user is admin
  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuthHeader />

      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive system administration and user management
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading dashboard...</span>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2" onClick={() => !users.length && fetchUsers()}>
                  <Users className="h-4 w-4" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Access Requests
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-2" onClick={() => {
                  if (!emailUsers.length) fetchEmailUsers();
                  if (!emailLogs.length) fetchEmailLogs();
                }}>
                  <Mail className="h-4 w-4" />
                  Email Management
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2" onClick={() => !auditLogs.length && fetchAuditLogs()}>
                  <Activity className="h-4 w-4" />
                  Activity Logs
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.total_users || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Active registered users
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.active_users || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Active in last 30 days
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.pending_requests || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Editor access requests
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Status</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Online</div>
                      <p className="text-xs text-muted-foreground">
                        All systems operational
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Roles Distribution</CardTitle>
                      <CardDescription>Breakdown of users by role</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics?.role_counts || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ role, count }) => `${role}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analytics?.role_counts?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Registrations</CardTitle>
                      <CardDescription>Monthly registration trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics?.monthly_registrations || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                      </div>
                      <Button
                        onClick={() => setIsCreateUserDialogOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Create User
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Manage all users, their roles, and access permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search users by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading users...</span>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No users found</h3>
                        <p className="text-muted-foreground">
                          {userSearchTerm || roleFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'No users are currently registered.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Account Status</TableHead>
                              <TableHead>Activity</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Experience</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.user_id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                                    {user.full_name || 'N/A'}
                                  </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Select
                                    value={user.role_id.toString()}
                                    onValueChange={(value) => handleUpdateUserRole(user.user_id, parseInt(value))}
                                    disabled={updatingUserRoles.has(user.user_id)}
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">Admin</SelectItem>
                                      <SelectItem value="2">Editor</SelectItem>
                                      <SelectItem value="3">User</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={user.status}
                                    onValueChange={(value) => handleUpdateUserStatus(user.user_id, value)}
                                    disabled={updatingUserStatus.has(user.user_id)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(user.status)}
                                        <SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Active">
                                        <div className="flex items-center gap-2">
                                          <Play className="h-3 w-3" />
                                          Active
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Inactive">
                                        <div className="flex items-center gap-2">
                                          <Pause className="h-3 w-3" />
                                          Inactive
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Suspended">
                                        <div className="flex items-center gap-2">
                                          <Ban className="h-3 w-3" />
                                          Suspended
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Banned">
                                        <div className="flex items-center gap-2">
                                          <X className="h-3 w-3" />
                                          Banned
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={user.is_active ? "default" : "secondary"}>
                                    {user.is_active ? 'Online' : 'Offline'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{user.location || 'N/A'}</TableCell>
                                <TableCell>{user.years_of_experience || 0} years</TableCell>
                                <TableCell>{formatDate(user.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    {(updatingUserRoles.has(user.user_id) ||
                                      updatingUserStatus.has(user.user_id) ||
                                      updatingUserProfile.has(user.user_id)) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditUser(user)}
                                          title="Edit Profile"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleChangePassword(user)}
                                          title="Change Password"
                                        >
                                          <Key className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          title="View Details"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Profile Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit User Profile
                      </DialogTitle>
                      <DialogDescription>
                        Update user information and profile details. Changes will be saved immediately.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="practice_area">Practice Area</Label>
                        <Input
                          id="practice_area"
                          value={editForm.practice_area}
                          onChange={(e) => setEditForm(prev => ({ ...prev, practice_area: e.target.value }))}
                          placeholder="Enter practice area"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="years_of_experience">Years of Experience</Label>
                        <Input
                          id="years_of_experience"
                          type="number"
                          min="0"
                          value={editForm.years_of_experience}
                          onChange={(e) => setEditForm(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                          placeholder="Enter years of experience"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Enter user bio"
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={editingUser && updatingUserProfile.has(editingUser.user_id)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveUserProfile}
                        disabled={editingUser && updatingUserProfile.has(editingUser.user_id)}
                      >
                        {editingUser && updatingUserProfile.has(editingUser.user_id) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Create User Dialog */}
                <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New User
                      </DialogTitle>
                      <DialogDescription>
                        Create a new user account with profile information. All fields marked with * are required.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      {/* Basic Account Information */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_email">Email Address *</Label>
                        <Input
                          id="create_email"
                          type="email"
                          value={createUserForm.email}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_role">User Role *</Label>
                        <Select
                          value={createUserForm.role_id.toString()}
                          onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, role_id: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Admin</SelectItem>
                            <SelectItem value="2">Editor</SelectItem>
                            <SelectItem value="3">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_password">Password *</Label>
                        <Input
                          id="create_password"
                          type="password"
                          value={createUserForm.password}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password (min 6 characters)"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_confirm_password">Confirm Password *</Label>
                        <Input
                          id="create_confirm_password"
                          type="password"
                          value={createUserForm.confirmPassword}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm password"
                          required
                        />
                      </div>

                      {/* Profile Information */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4 mt-6">Profile Information</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_full_name">Full Name</Label>
                        <Input
                          id="create_full_name"
                          value={createUserForm.full_name}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_phone">Phone Number</Label>
                        <Input
                          id="create_phone"
                          value={createUserForm.phone}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_practice_area">Practice Area</Label>
                        <Input
                          id="create_practice_area"
                          value={createUserForm.practice_area}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, practice_area: e.target.value }))}
                          placeholder="Enter practice area"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_location">Location</Label>
                        <Input
                          id="create_location"
                          value={createUserForm.location}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_years_experience">Years of Experience</Label>
                        <Input
                          id="create_years_experience"
                          type="number"
                          min="0"
                          value={createUserForm.years_of_experience}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                          placeholder="Enter years of experience"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create_law_specialization">Law Specialization</Label>
                        <Input
                          id="create_law_specialization"
                          value={createUserForm.law_specialization}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, law_specialization: e.target.value }))}
                          placeholder="Enter law specialization"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="create_bio">Bio</Label>
                        <Textarea
                          id="create_bio"
                          value={createUserForm.bio}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Enter user bio"
                          rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateUserDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Change Password Dialog */}
                <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Change Password
                      </DialogTitle>
                      <DialogDescription>
                        Change password for {passwordChangeUser?.full_name || passwordChangeUser?.email}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                        <Input
                          id="confirm_new_password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangePasswordDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSavePassword}>
                        <Save className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Access Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Editor Access Requests
                    </CardTitle>
                    <CardDescription>
                      Review and manage user requests for editor privileges
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {accessRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                        <p className="text-muted-foreground">
                          All editor access requests have been processed.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Practice Area</TableHead>
                              <TableHead>Requested At</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accessRequests.map((request) => (
                              <TableRow key={request.request_id}>
                                <TableCell className="font-medium">
                                  {request.full_name}
                                </TableCell>
                                <TableCell>{request.practice_area}</TableCell>
                                <TableCell>{formatDate(request.requested_at)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    {request.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => handleApproveOrDeny(request.request_id, 'Approve')}
                                      disabled={processingRequests.has(request.request_id)}
                                    >
                                      {processingRequests.has(request.request_id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => handleApproveOrDeny(request.request_id, 'Deny')}
                                      disabled={processingRequests.has(request.request_id)}
                                    >
                                      {processingRequests.has(request.request_id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                      Deny
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Email Management Tab */}
              <TabsContent value="emails" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Send Email Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Send className="h-5 w-5" />
                          Send Email
                        </div>
                        <Button
                          onClick={() => setIsSendEmailDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Compose Email
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Send announcements and notifications to users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Email Notification System</h3>
                          <p className="text-muted-foreground mb-4">
                            Send test emails with dummy content to selected users to demonstrate the email system functionality.
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                            <h4 className="font-semibold text-blue-900 mb-2">📧 Email System Features:</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Select specific users or groups</li>
                              <li>• Professional email templates</li>
                              <li>• Delivery tracking and logs</li>
                              <li>• Placeholder content for testing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Logs Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Email Logs
                      </CardTitle>
                      <CardDescription>
                        Track sent emails and delivery status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {emailLogsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Loading email logs...</span>
                        </div>
                      ) : emailLogs.length === 0 ? (
                        <div className="text-center py-8">
                          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No emails sent</h3>
                          <p className="text-muted-foreground">
                            Email logs will appear here after sending emails.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {emailLogs.slice(0, 10).map((log) => (
                            <div key={log.email_id} className="border rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{log.subject}</h4>
                                <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                  {log.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>Sent by: {log.sender_name}</p>
                                <p>Recipients: {log.recipient_count} users</p>
                                <p>Type: {log.email_type}</p>
                                <p>Date: {formatDate(log.sent_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Send Email Dialog */}
                <Dialog open={isSendEmailDialogOpen} onOpenChange={setIsSendEmailDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Send Email to Users
                      </DialogTitle>
                      <DialogDescription>
                        Compose and send emails to selected users. This is a test email with dummy content.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                      {/* User Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Select Recipients</h3>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="select-all"
                              checked={selectedUsers.length === emailUsers.length && emailUsers.length > 0}
                              onCheckedChange={handleSelectAllUsers}
                            />
                            <Label htmlFor="select-all" className="text-sm">Select All</Label>
                          </div>
                        </div>

                        {emailUsersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading users...</span>
                          </div>
                        ) : (
                          <div className="border rounded-lg max-h-80 overflow-y-auto">
                            {emailUsers.map((user) => (
                              <div key={user.user_id} className="flex items-center space-x-3 p-3 border-b last:border-b-0">
                                <Checkbox
                                  id={`user-${user.user_id}`}
                                  checked={selectedUsers.includes(user.user_id)}
                                  onCheckedChange={(checked) => handleUserSelection(user.user_id, checked as boolean)}
                                />
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={`user-${user.user_id}`} className="text-sm font-medium cursor-pointer">
                                    {user.full_name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  <p className="text-xs text-muted-foreground">{user.practice_area} • {user.role_name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          Selected: {selectedUsers.length} of {emailUsers.length} users
                        </div>
                      </div>

                      {/* Email Composition */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Compose Email</h3>

                        <div className="space-y-2">
                          <Label htmlFor="email-subject">Subject</Label>
                          <Input
                            id="email-subject"
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter email subject"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-type">Email Type</Label>
                          <Select
                            value={emailForm.emailType}
                            onValueChange={(value) => setEmailForm(prev => ({ ...prev, emailType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="announcement">Announcement</SelectItem>
                              <SelectItem value="notification">Notification</SelectItem>
                              <SelectItem value="test">Test Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-content">Content</Label>
                          <Textarea
                            id="email-content"
                            value={emailForm.content}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter your message content here..."
                            rows={8}
                          />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> This will send a test email with professional styling and dummy content
                            to demonstrate the email system functionality.
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsSendEmailDialogOpen(false)}
                        disabled={sendingEmail}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendEmail}
                        disabled={sendingEmail || selectedUsers.length === 0}
                      >
                        {sendingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Email ({selectedUsers.length} recipients)
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Activity Logs Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Admin Activity Logs
                    </CardTitle>
                    <CardDescription>
                      Track all administrative actions and system changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditLogsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading activity logs...</span>
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No activity logs</h3>
                        <p className="text-muted-foreground">
                          No administrative actions have been recorded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Admin</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Timestamp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log) => (
                              <TableRow key={log.log_id}>
                                <TableCell className="font-medium">
                                  {log.admin_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {log.action_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-md truncate">
                                  {log.action_details}
                                </TableCell>
                                <TableCell>{formatDate(log.timestamp)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Activity Overview</CardTitle>
                      <CardDescription>Active vs Inactive users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Active', count: analytics?.active_users || 0 },
                          { name: 'Inactive', count: (analytics?.total_users || 0) - (analytics?.active_users || 0) }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Metrics</CardTitle>
                      <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Users</span>
                        <span className="text-2xl font-bold">{analytics?.total_users || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Active Users (30d)</span>
                        <span className="text-2xl font-bold text-green-600">{analytics?.active_users || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Pending Requests</span>
                        <span className="text-2xl font-bold text-yellow-600">{analytics?.pending_requests || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Activity Rate</span>
                        <span className="text-2xl font-bold">
                          {analytics?.total_users ? Math.round((analytics.active_users / analytics.total_users) * 100) : 0}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
