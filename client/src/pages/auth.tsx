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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 p-8">
        <div className="w-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl relative overflow-hidden flex flex-col justify-between p-12 text-white">
          {/* Decorative wave pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" opacity="0.1"/>
                  <path d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z" fill="white" opacity="0.05"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wave)" />
            </svg>
          </div>
          
          {/* Hero content */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Welcome to SimpleFlow</h1>
            <p className="text-lg opacity-90">Your Gateway to Effortless Management.</p>
          </div>
          
          {/* Bottom content */}
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-4">Seamless Collaboration</h2>
            <p className="text-base opacity-90 mb-8">
              Effortlessly work together with your team in real-time.
            </p>
            
            {/* Progress indicators */}
            <div className="flex space-x-2">
              <div className="w-8 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-right mb-8">
            <h2 className="text-xl font-semibold text-gray-900">SimpleFlow</h2>
          </div>

          {/* Mode switcher */}
          <div className="flex mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`px-6 py-2 text-sm font-medium rounded-l-lg border transition-colors ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`px-6 py-2 text-sm font-medium rounded-r-lg border-l-0 border transition-colors ${
                mode === 'login'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === 'signup' ? (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700">Email Id</Label>
                  <Input
                    id="email"
                    type="email"
                    {...signupForm.register('email')}
                    className="mt-1 border-gray-300"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                      Forget Password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    {...signupForm.register('password')}
                    className="mt-1 border-gray-300"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                  
                  {/* Password requirements */}
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <div>Password Strength: <span className="text-gray-700">Weak</span></div>
                    <div>Cannot contain your name or email address</div>
                    <div>At least 8 Characters</div>
                    <div>Contains a number or symbol</div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700">Email Id</Label>
                  <Input
                    id="email"
                    type="email"
                    {...loginForm.register('email')}
                    className="mt-1 border-gray-300"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                      Forget Password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    {...loginForm.register('password')}
                    className="mt-1 border-gray-300"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* Social login options */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Button variant="outline" className="w-full p-3 border-gray-300">
                <FaGoogle className="w-4 h-4 text-gray-600" />
              </Button>
              <Button variant="outline" className="w-full p-3 border-gray-300">
                <FaApple className="w-4 h-4 text-gray-600" />
              </Button>
              <Button variant="outline" className="w-full p-3 border-gray-300">
                <FaMicrosoft className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center text-xs text-gray-500">
              By signing up Business, I accept Company's{' '}
              <button className="text-blue-600 hover:text-blue-500">
                Terms of use
              </button>{' '}
              &{' '}
              <button className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}