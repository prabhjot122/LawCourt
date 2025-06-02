import React, { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  MapPin,
  Phone,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Users,
  UserPlus,
  Settings,
  Mail,
  Globe,
  Edit,
  Camera,
  Shield,
  Bell,
  Eye,
  Lock,
  Download,
  Upload,
  FileText,
  BarChart3,
  User,
  GraduationCap,
  Building,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { contentApi } from '@/services/api';

const Profile = () => {
  const { user, logout, requestEditorAccess } = useAuth();
  const { toast } = useToast();
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Function to handle editor access request
  const handleRequestEditorAccess = async () => {
    setIsRequestingAccess(true);
    try {
      const success = await requestEditorAccess();
      if (success) {
        toast({
          title: 'Request Submitted',
          description: 'Your editor access request has been sent to administrators for review.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: 'Failed to submit editor access request. You may already have a pending request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your request.',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingAccess(false);
    }
  };

  // Function to get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-destructive text-destructive-foreground';
      case UserRole.EDITOR:
        return 'bg-blue-500 text-white';
      case UserRole.USER:
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Function to get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden mb-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Profile Settings
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Manage your account information and preferences
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Profile Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{user.role} Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-gray-100 shadow-xl bg-white sticky top-8">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32 ring-4 ring-white shadow-xl">
                        <AvatarImage src={user.profilePhoto} alt={user.fullName} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-900 to-black text-white">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-300">
                        <Camera className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-black modern-heading mb-2">{user.fullName}</CardTitle>
                  <CardDescription className="text-gray-600 mb-4">{user.email}</CardDescription>
                  <div className="flex justify-center">
                    <Badge className={cn(
                      "px-4 py-2 text-sm font-bold rounded-xl",
                      user.role === UserRole.ADMIN && "bg-red-100 text-red-800",
                      user.role === UserRole.EDITOR && "bg-blue-100 text-blue-800",
                      user.role === UserRole.USER && "bg-gray-100 text-gray-800"
                    )}>
                      {user.role === UserRole.ADMIN && <Shield className="h-4 w-4 mr-2" />}
                      {user.role === UserRole.EDITOR && <Edit className="h-4 w-4 mr-2" />}
                      {user.role === UserRole.USER && <User className="h-4 w-4 mr-2" />}
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Practice Area */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                        <Briefcase className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">{user.practiceArea}</span>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      {user.phoneNumber && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Phone className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-medium text-gray-700">{user.phoneNumber}</span>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <MapPin className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-medium text-gray-700">{user.location}</span>
                        </div>
                      )}
                      {user.linkedinUrl && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <ExternalLink className="h-4 w-4 text-gray-700" />
                          <a
                            href={user.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-700 hover:text-black transition-colors duration-300"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      {/* Admin Dashboard Link */}
                      {user.role === UserRole.ADMIN && (
                        <Button
                          asChild
                          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <Link to="/admin">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin Dashboard
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </Link>
                        </Button>
                      )}

                      {/* Request Editor Access Button */}
                      {user.role === UserRole.USER && (
                        <Button
                          onClick={handleRequestEditorAccess}
                          disabled={isRequestingAccess}
                          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          {isRequestingAccess ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Requesting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Request Editor Access
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                          )}
                        </Button>
                      )}

                      <Button
                        onClick={logout}
                        variant="outline"
                        className="w-full h-12 border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-300"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Sign Out
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Profile Details */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-100 shadow-xl bg-white">
                <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-md border border-gray-300">
                      <User className="h-5 w-5 text-gray-800" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-black modern-heading">Profile Information</CardTitle>
                      <CardDescription className="text-gray-600">
                        Your personal and professional details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <Tabs defaultValue="personal" className="w-full">
                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl mb-8">
                      <div className="flex justify-center">
                        <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                          <TabsTrigger
                            value="personal"
                            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                          >
                            <User className="h-4 w-4" />
                            Personal
                          </TabsTrigger>
                          <TabsTrigger
                            value="professional"
                            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                          >
                            <Briefcase className="h-4 w-4" />
                            Professional
                          </TabsTrigger>
                          <TabsTrigger
                            value="legal"
                            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                          >
                            <GraduationCap className="h-4 w-4" />
                            Legal
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>

                    {/* Personal Information Tab */}
                    <TabsContent value="personal" className="space-y-8 mt-8">
                      <div className="bg-gray-50 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-800">Bio</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Building className="h-5 w-5 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-800">Organization</h3>
                          </div>
                          <p className="text-gray-700 font-medium">{user.organization}</p>
                        </div>
                        {user.location && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <MapPin className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Location</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.location}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-800">Account Type</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "px-4 py-2 text-sm font-bold rounded-xl",
                            user.role === UserRole.ADMIN && "bg-red-100 text-red-800",
                            user.role === UserRole.EDITOR && "bg-blue-100 text-blue-800",
                            user.role === UserRole.USER && "bg-gray-100 text-gray-800"
                          )}>
                            {user.role === UserRole.ADMIN && <Shield className="h-4 w-4 mr-2" />}
                            {user.role === UserRole.EDITOR && <Edit className="h-4 w-4 mr-2" />}
                            {user.role === UserRole.USER && <User className="h-4 w-4 mr-2" />}
                            {user.role}
                          </Badge>
                          <span className="text-sm text-gray-600 font-medium">
                            {user.role === UserRole.ADMIN && 'Full system access and administration'}
                            {user.role === UserRole.EDITOR && 'Content management and publishing'}
                            {user.role === UserRole.USER && 'Standard user access and features'}
                          </span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Professional Information Tab */}
                    <TabsContent value="professional" className="space-y-8 mt-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Briefcase className="h-5 w-5 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-800">Practice Area</h3>
                          </div>
                          <p className="text-gray-700 font-medium">{user.practiceArea}</p>
                        </div>
                        {user.lawSpecialization && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <Award className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Law Specialization</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.lawSpecialization}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.education && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <GraduationCap className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Education</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.education}</p>
                          </div>
                        )}
                        {user.alumniInformation && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <BookOpen className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Alumni Information</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.alumniInformation}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.yearsOfExperience !== undefined && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <TrendingUp className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Years of Experience</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.yearsOfExperience} years</p>
                          </div>
                        )}
                        {user.professionalMemberships && (
                          <div className="bg-gray-50 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <Users className="h-5 w-5 text-gray-700" />
                              <h3 className="text-lg font-semibold text-gray-800">Professional Memberships</h3>
                            </div>
                            <p className="text-gray-700 font-medium">{user.professionalMemberships}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Legal Information Tab */}
                    <TabsContent value="legal" className="space-y-8 mt-8">
                      {user.barExamStatus && (
                        <div className="bg-gray-50 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <GraduationCap className="h-5 w-5 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-800">Bar Exam Status</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "px-4 py-2 text-sm font-bold rounded-xl",
                              user.barExamStatus === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            )}>
                              {user.barExamStatus === 'Passed' && <CheckCircle className="h-4 w-4 mr-2" />}
                              {user.barExamStatus !== 'Passed' && <Clock className="h-4 w-4 mr-2" />}
                              {user.barExamStatus}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {user.licenseNumber && (
                        <div className="bg-gray-50 p-6 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Award className="h-5 w-5 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-800">License Number</h3>
                          </div>
                          <p className="text-gray-700 font-medium font-mono bg-white px-4 py-2 rounded-lg border border-gray-200">
                            {user.licenseNumber}
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-50 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <BookOpen className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-800">Legal Resources</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          Personalized legal resources and practice materials based on your specialization and practice area will be displayed here.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end pt-6 bg-gray-50">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 group"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Additional sections could be added here if needed */}
            </div>
          </div>
        </div>
      </main>


    </div>
  );
};

export default Profile;
