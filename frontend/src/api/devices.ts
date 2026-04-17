import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Device, DeviceCreateResponse } from './types';

export const useDevices = () => {
  return useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => apiClient<Device[]>('/devices'),
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  return useMutation<DeviceCreateResponse, Error, { name: string }>({
    mutationFn: (data) => apiClient<DeviceCreateResponse>('/devices', { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiClient<void>(`/devices/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};
