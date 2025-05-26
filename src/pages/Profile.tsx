import React, { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AuthHeader from '@/components/AuthHeader';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, MapPin, Phone, Award, BookOpen, Briefcase, Calendar, Users, UserPlus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-background flex flex-col">
      <AuthHeader />

      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column - Profile Card */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.profilePhoto} alt={user.fullName} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl">{user.fullName}</CardTitle>
                  <CardDescription className="text-sm">{user.email}</CardDescription>
                  <div className="mt-2">
                    <Badge className={cn(getRoleBadgeColor(user.role))}>
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{user.practiceArea}</p>
                    {user.phoneNumber && (
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.linkedinUrl && (
                      <div className="flex items-center justify-center text-sm text-primary">
                        <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          <span>LinkedIn Profile</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Admin Dashboard Link */}
                    {user.role === UserRole.ADMIN && (
                      <Button asChild variant="default" className="w-full">
                        <Link to="/admin">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}

                    {/* Request Editor Access Button */}
                    {user.role === UserRole.USER && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleRequestEditorAccess}
                        disabled={isRequestingAccess}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isRequestingAccess ? 'Requesting...' : 'Request Editor Access'}
                      </Button>
                    )}

                    <Button variant="outline" className="w-full" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Profile Details */}
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your personal and professional information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="professional">Professional</TabsTrigger>
                      <TabsTrigger value="legal">Legal</TabsTrigger>
                    </TabsList>

                    {/* Personal Information Tab */}
                    <TabsContent value="personal" className="space-y-6 mt-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                        <p className="text-sm">{user.bio}</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Organization</h3>
                          <p className="text-sm">{user.organization}</p>
                        </div>
                        {user.location && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                            <p className="text-sm">{user.location}</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Type</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn(getRoleBadgeColor(user.role))}>
                            {user.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {user.role === UserRole.ADMIN && 'Full system access'}
                            {user.role === UserRole.EDITOR && 'Content management access'}
                            {user.role === UserRole.USER && 'Standard user access'}
                          </span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Professional Information Tab */}
                    <TabsContent value="professional" className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Practice Area</h3>
                          <p className="text-sm">{user.practiceArea}</p>
                        </div>
                        {user.lawSpecialization && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Law Specialization</h3>
                            <p className="text-sm">{user.lawSpecialization}</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.education && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Education</h3>
                            <p className="text-sm">{user.education}</p>
                          </div>
                        )}
                        {user.alumniInformation && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Alumni Information</h3>
                            <p className="text-sm">{user.alumniInformation}</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.yearsOfExperience !== undefined && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Years of Experience</h3>
                            <p className="text-sm">{user.yearsOfExperience} years</p>
                          </div>
                        )}
                        {user.professionalMemberships && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Professional Memberships</h3>
                            <p className="text-sm">{user.professionalMemberships}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Legal Information Tab */}
                    <TabsContent value="legal" className="space-y-6 mt-4">
                      {user.barExamStatus && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Bar Exam Status</h3>
                          <div className="flex items-center">
                            <Badge className={user.barExamStatus === 'Passed' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                              {user.barExamStatus}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {user.licenseNumber && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">License Number</h3>
                            <p className="text-sm">{user.licenseNumber}</p>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Legal Resources</h3>
                        <p className="text-sm text-muted-foreground">
                          Personalized legal resources based on your practice area will be displayed here.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </CardFooter>
              </Card>

              {/* Additional sections could be added here if needed */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
