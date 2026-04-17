import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { SystemStatus } from './types';

export const useStatus = () => {
  return useQuery<SystemStatus>({
    queryKey: ['status'],
    queryFn: () => apiClient<SystemStatus>('/status'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
