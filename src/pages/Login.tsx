import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import OAuthProfileCompletion from '@/components/OAuthProfileCompletion';
import { Scale, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [oauthUserId, setOauthUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Get the redirect path from location state or default to profile
  const from = (location.state as any)?.from?.pathname || '/profile';

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(data.email, data.password);

      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = () => {
    navigate(from, { replace: true });
  };

  // Handle OAuth profile completion requirement
  const handleProfileCompletion = (userId: number) => {
    setOauthUserId(userId);
    setShowProfileCompletion(true);
  };

  // Handle OAuth profile completion success
  const handleProfileCompletionSuccess = () => {
    setShowProfileCompletion(false);
    navigate(from, { replace: true });
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
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
              <Scale className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black tracking-tight modern-heading mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in to your LawFort account to continue your legal journey
          </p>
        </div>

        <Card className="border-2 border-gray-100 shadow-2xl bg-white">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-2xl font-bold text-center text-black modern-heading">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          className="border-2 border-gray-200 focus:border-gray-900 rounded-xl h-12 text-base"
                          {...field}
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="border-2 border-gray-200 focus:border-gray-900 rounded-xl h-12 text-base pr-12"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <GoogleOAuthButton
                onSuccess={handleGoogleSuccess}
                onProfileCompletion={handleProfileCompletion}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6 bg-gray-50">
            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/signup"
                className="text-black font-semibold hover:text-gray-700 transition-colors duration-300"
              >
                Create Account
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

export default Login;
