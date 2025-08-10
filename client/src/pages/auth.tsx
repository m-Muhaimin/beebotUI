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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Auth form */}
      <div className="w-full max-w-md p-8 bg-[#749fed14] pl-[40px] pr-[40px] pt-[40px] pb-[40px]">
          {/* Logo */}
          <div className="text-right mb-8">
            <h2 className="text-xl font-semibold text-gray-900 text-center">BeeBot</h2>
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
  );
}