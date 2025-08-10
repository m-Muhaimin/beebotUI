import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSignup, useLogin } from '@/hooks/useAuth';
import { signupSchema, loginSchema } from '@shared/schema';
import { FaGoogle, FaApple, FaMicrosoft } from 'react-icons/fa';

type AuthMode = 'login' | 'signup';

// Extend signup schema for confirm password
const signupFormSchema = signupSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupFormSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const signupMutation = useSignup();
  const loginMutation = useLogin();

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      firstName: '',
      lastName: '',
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSignup = async (data: SignupFormData) => {
    try {
      const { confirmPassword, ...signupData } = data;
      await signupMutation.mutateAsync(signupData);
      toast({
        title: 'Welcome to BeeBot!',
        description: 'Your account has been created successfully.',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup.',
        variant: 'destructive',
      });
    }
  };

  const onLogin = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = signupMutation.isPending || loginMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand and illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
        
        {/* Decorative wave patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            <defs>
              <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,50 Q25,0 50,50 T100,50" stroke="white" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-16">
            <h1 className="text-5xl font-bold mb-4">Welcome to BeeBot</h1>
            <p className="text-xl opacity-90">Your Gateway to Effortless AI Conversations.</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-4">Seamless Collaboration</h2>
            <p className="text-lg opacity-90">
              Effortlessly work together with your AI assistant in real-time.
            </p>
          </div>
          
          {/* Progress indicators */}
          <div className="flex space-x-2">
            <div className="w-8 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">BeeBot</h2>
          </div>

          {/* Mode switcher */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          <Card className="p-6">
            {mode === 'signup' ? (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Id</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...signupForm.register('email')}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      {...signupForm.register('firstName')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      {...signupForm.register('lastName')}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    {...signupForm.register('username')}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    {...signupForm.register('password')}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    {...signupForm.register('confirmPassword')}
                    className="mt-1"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Id</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register('email')}
                    className="mt-1"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Forget Password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    {...loginForm.register('password')}
                    className="mt-1"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* Social login options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Button variant="outline" className="w-full">
                  <FaGoogle className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full">
                  <FaApple className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full">
                  <FaMicrosoft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
              By signing up, I accept Company's{' '}
              <button className="text-blue-600 hover:text-blue-500">
                Terms of use
              </button>{' '}
              &{' '}
              <button className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}