import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, SignupData } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import OAuthProfileCompletion from '@/components/OAuthProfileCompletion';
import { Scale, UserPlus, ArrowRight, AlertCircle } from 'lucide-react';

// Define form schema
const formSchema = z.object({
  // Required fields
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  practiceArea: z.string().min(2, 'Practice area is required'),
  organization: z.string().min(2, 'Organization/College name is required'),

  // Optional fields
  phoneNumber: z.string().optional(),
  lawSpecialization: z.string().optional(),
  education: z.string().optional(),
  barExamStatus: z.enum(['Passed', 'Pending', 'Not Applicable']).optional(),
  licenseNumber: z.string().optional(),
  location: z.string().optional(),
  yearsOfExperience: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  alumniInformation: z.string().optional(),
  professionalMemberships: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [oauthUserId, setOauthUserId] = useState<number | null>(null);

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Required fields
      email: '',
      fullName: '',
      password: '',
      bio: '',
      practiceArea: '',
      organization: '',

      // Optional fields
      phoneNumber: '',
      lawSpecialization: '',
      education: '',
      barExamStatus: undefined,
      licenseNumber: '',
      location: '',
      yearsOfExperience: '',
      linkedinUrl: '',
      alumniInformation: '',
      professionalMemberships: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Map form data to SignupData interface
      const signupData: SignupData = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        bio: data.bio,
        practiceArea: data.practiceArea,
        organization: data.organization,
        lawSpecialization: data.lawSpecialization,
        education: data.education,
        barExamStatus: data.barExamStatus,
        licenseNumber: data.licenseNumber,
        location: data.location,
        yearsOfExperience: data.yearsOfExperience,
        linkedinUrl: data.linkedinUrl,
        alumniInformation: data.alumniInformation,
        professionalMemberships: data.professionalMemberships,
      };

      const success = await signup(signupData);

      if (success) {
        navigate('/profile', { replace: true });
      } else {
        setError('Email already exists or registration failed');
      }
    } catch (err) {
      setError('An error occurred during signup');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = () => {
    navigate('/profile', { replace: true });
  };

  // Handle OAuth profile completion requirement
  const handleProfileCompletion = (userId: number) => {
    setOauthUserId(userId);
    setShowProfileCompletion(true);
  };

  // Handle OAuth profile completion success
  const handleProfileCompletionSuccess = () => {
    setShowProfileCompletion(false);
    navigate('/profile', { replace: true });
  };

  // Show profile completion form if needed
  if (showProfileCompletion && oauthUserId) {
    return (
      <OAuthProfileCompletion
        userId={oauthUserId}
        onComplete={handleProfileCompletionSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
              <Scale className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black tracking-tight modern-heading mb-3">
            Join LawFort
          </h1>
          <p className="text-gray-600 text-lg">
            Create your account to access legal resources and opportunities
          </p>
        </div>

        <Card className="border-2 border-gray-100 shadow-2xl bg-white">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-2xl font-bold text-center text-black modern-heading flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Fill in your information to get started
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="essential" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="essential">Essential Info</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>

                {/* Essential Information Tab */}
                <TabsContent value="essential" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent value="professional" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="practiceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Area *</FormLabel>
                        <FormDescription>
                          E.g., Student, Corporate Law, Criminal Law, etc.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="Enter your practice area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lawSpecialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Law Specialization</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your law specialization" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormDescription>
                          E.g., J.D., Harvard Law School
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="Enter your education" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barExamStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bar Exam Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your bar exam status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Passed">Passed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your license number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter years of experience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Additional Information Tab */}
                <TabsContent value="additional" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization/College Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your organization or college" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alumniInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alumni Information</FormLabel>
                        <FormDescription>
                          E.g., Harvard Law School, Class of 2010
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="Enter your alumni information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your LinkedIn profile URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professionalMemberships"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Organizations/Memberships</FormLabel>
                        <FormDescription>
                          E.g., American Bar Association, New York State Bar Association
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your professional memberships"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">{error}</span>
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleOAuthButton
                onSuccess={handleGoogleSuccess}
                onProfileCompletion={handleProfileCompletion}
              />
            </div>
          </div>
        </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6 bg-gray-50">
            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-black font-semibold hover:text-gray-700 transition-colors duration-300"
              >
                Sign In
              </Link>
            </div>
            <div className="text-center">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-300 text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
