import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type User, type SignupUser, type LoginUser } from '@shared/schema';

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data: authData, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user,
    error,
  };
}

export function useSignup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: SignupUser): Promise<AuthResponse> => {
      return await apiRequest('/api/auth/signup', 'POST', userData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginUser): Promise<AuthResponse> => {
      return await apiRequest('/api/auth/login', 'POST', credentials);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/logout', 'POST');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}