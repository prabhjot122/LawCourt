import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Define form schema for required fields
const formSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  practice_area: z.string().min(2, 'Practice area is required'),
  bar_exam_status: z.enum(['Passed', 'Pending', 'Not Applicable']),
  phone: z.string().optional(),
  law_specialization: z.string().optional(),
  education: z.string().optional(),
  license_number: z.string().optional(),
  location: z.string().optional(),
  years_of_experience: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  linkedin_profile: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  alumni_of: z.string().optional(),
  professional_organizations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OAuthProfileCompletionProps {
  userId: number;
  onComplete?: () => void;
}

const OAuthProfileCompletion: React.FC<OAuthProfileCompletionProps> = ({ 
  userId, 
  onComplete 
}) => {
  const { completeOAuthProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: '',
      practice_area: '',
      bar_exam_status: 'Not Applicable',
      phone: '',
      law_specialization: '',
      education: '',
      license_number: '',
      location: '',
      years_of_experience: '',
      linkedin_profile: '',
      alumni_of: '',
      professional_organizations: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const profileData = {
        user_id: userId,
        ...data,
      };

      const success = await completeOAuthProfile(profileData);

      if (success) {
        toast.success('Profile completed successfully!');
        if (onComplete) {
          onComplete();
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        toast.error('Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error('An error occurred while completing your profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide additional information to complete your LawFort profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Required Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Required Information</h3>
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your legal background and expertise..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="practice_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice Area *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Corporate Law, Criminal Defense, Family Law" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bar_exam_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bar Exam Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-muted-foreground">Additional Information (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
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
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="law_specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Law Specialization</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Intellectual Property" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="years_of_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., J.D., Harvard Law School" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your bar license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedin_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alumni_of"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alumni Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Law school, graduation year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professional_organizations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Organizations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any professional organizations you belong to..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Completing Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthProfileCompletion;
