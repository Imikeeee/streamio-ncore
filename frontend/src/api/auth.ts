import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { SetupSchema, LoginSchema, AuthResponse } from './types';

export const useCheckSetup = () => {
  return useQuery<{ isConfigured: boolean }>({
    queryKey: ['check-setup'],
    queryFn: () => apiClient<{ isConfigured: boolean }>('/auth/check-setup'),
  });
};

export const useSetup = () => {
  return useMutation<AuthResponse, Error, SetupSchema>({
    mutationFn: (data) => apiClient<AuthResponse>('/auth/setup', { body: data }),
  });
};

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginSchema>({
    mutationFn: (data) => apiClient<AuthResponse>('/auth/login', { body: data }),
  });
};
