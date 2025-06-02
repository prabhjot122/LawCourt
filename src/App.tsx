import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, UserRole } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Profile = React.lazy(() => import("./pages/Profile"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const CompleteProfile = React.lazy(() => import("./pages/CompleteProfile"));

// Lazy load content management pages
const BlogPosts = React.lazy(() => import("./pages/content/BlogPosts"));
const BlogPost = React.lazy(() => import("./pages/content/BlogPost"));
const CreateEditBlogPost = React.lazy(() => import("./pages/content/CreateEditBlogPost"));
const MinimalBlogWriter = React.lazy(() => import("./pages/content/MinimalBlogWriter"));
const ResearchPapers = React.lazy(() => import("./pages/content/ResearchPapers"));
const ResearchPaperDetail = React.lazy(() => import("@/pages/content/ResearchPaperDetail"));
const SubmitResearchPaper = React.lazy(() => import("@/pages/content/SubmitResearchPaper"));
const CreateEditResearchPaper = React.lazy(() => import("./pages/content/CreateEditResearchPaper"));
const PersonalLibrary = React.lazy(() => import("@/pages/user/PersonalLibrary"));
const Notes = React.lazy(() => import("./pages/content/Notes"));
const NoteDetail = React.lazy(() => import("./pages/content/NoteDetail"));
const CreateEditNote = React.lazy(() => import("./pages/content/CreateEditNote"));
const Courses = React.lazy(() => import("./pages/content/Courses"));
const CourseDetail = React.lazy(() => import("./pages/content/CourseDetail"));
const CreateEditCourse = React.lazy(() => import("./pages/content/CreateEditCourse"));

// Lazy load career pages
const Jobs = React.lazy(() => import("./pages/career/Jobs"));
const JobDetail = React.lazy(() => import("./pages/career/JobDetail"));
const CreateEditJob = React.lazy(() => import("./pages/career/CreateEditJob"));
const Internships = React.lazy(() => import("./pages/career/Internships"));
const InternshipDetail = React.lazy(() => import("./pages/career/InternshipDetail"));
const CreateEditInternship = React.lazy(() => import("./pages/career/CreateEditInternship"));
const Applications = React.lazy(() => import("./pages/career/Applications"));
const ApplicationManagement = React.lazy(() => import("./pages/admin/Applications"));

// Lazy load dashboard pages
const UserDashboard = React.lazy(() => import("./pages/dashboard/UserDashboard"));
const EditorDashboard = React.lazy(() => import("./pages/dashboard/EditorDashboard"));

// Lazy load advanced features
const Notifications = React.lazy(() => import("./pages/Notifications"));
const GlobalSearch = React.lazy(() => import("./pages/GlobalSearch"));
const Settings = React.lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();
// Note: This is a demo client ID. For production, you need to:
// 1. Create your own Google OAuth app at https://console.developers.google.com
// 2. Add your domain to authorized origins
// 3. Replace this client ID with your own
const GOOGLE_CLIENT_ID = "517818204697-jpimspqvc3f4folciiapr6vbugs9t7hu.apps.googleusercontent.com";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <UserPreferencesProvider>
              <NotificationProvider>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Protected Routes with Main Layout */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.USER]}>
                    <MainLayout>
                      <UserDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <EditorDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                    <MainLayout>
                      <AdminDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Content Management Routes */}
              <Route
                path="/blogs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <BlogPosts />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ErrorBoundary>
                        <BlogPost />
                      </ErrorBoundary>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MinimalBlogWriter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MinimalBlogWriter />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/research"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ResearchPapers />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/research/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditResearchPaper />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/research-papers/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ResearchPaperDetail />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/research-papers/submit"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SubmitResearchPaper />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PersonalLibrary />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/research/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditResearchPaper />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notes />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NoteDetail />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditNote />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditNote />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Courses />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseDetail />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditCourse />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditCourse />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Career Routes */}
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Jobs />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <JobDetail />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditJob />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditJob />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/internships"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Internships />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/internships/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <InternshipDetail />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/internships/create"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditInternship />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/internships/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <CreateEditInternship />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Applications />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/manage-applications"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]}>
                    <MainLayout>
                      <ApplicationManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Notifications */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notifications />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Global Search */}
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <GlobalSearch />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </NotificationProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
