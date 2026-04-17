import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { User, SetupSchema } from './types';

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiClient<User[]>('/users'),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation<User, Error, SetupSchema>({
    mutationFn: (data) => apiClient<User>('/users', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['check-setup'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiClient<void>(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['check-setup'] });
    },
  });
};
