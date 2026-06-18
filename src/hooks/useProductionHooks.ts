import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as workOrderService from '../services/production.service';
import * as productionSessionService from '../services/production.service';

// Work Order hooks
export const useWorkOrders = (filters?: { status?: string; date?: string }) => {
  return useQuery({
    queryKey: ['workOrders', filters],
    queryFn: () => workOrderService.workOrderService.getAll(filters)
  });
};

export const useWorkOrder = (id: string) => {
  return useQuery({
    queryKey: ['workOrders', id],
    queryFn: () => workOrderService.workOrderService.getById(id),
    enabled: !!id
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workOrderService.workOrderService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    }
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof workOrderService.workOrderService.update>[1] }) =>
      workOrderService.workOrderService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    }
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workOrderService.workOrderService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    }
  });
};

export const useGenerateWONumber = () => {
  return useQuery({
    queryKey: ['generateWONumber'],
    queryFn: workOrderService.workOrderService.generateWONumber,
    enabled: false
  });
};

// Production Session hooks
export const useProductionSessions = (filters?: { status?: string; date?: string; shift_id?: string }) => {
  return useQuery({
    queryKey: ['productionSessions', filters],
    queryFn: () => productionSessionService.productionSessionService.getAll(filters)
  });
};

export const useProductionSession = (id: string) => {
  return useQuery({
    queryKey: ['productionSessions', id],
    queryFn: () => productionSessionService.productionSessionService.getById(id),
    enabled: !!id
  });
};

export const useCreateProductionSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionSessionService.productionSessionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionSessions'] });
    }
  });
};

export const useUpdateProductionSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof productionSessionService.productionSessionService.update>[1] }) =>
      productionSessionService.productionSessionService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productionSessions'] });
      queryClient.invalidateQueries({ queryKey: ['productionSessions', variables.id] });
    }
  });
};

export const useDeleteProductionSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionSessionService.productionSessionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionSessions'] });
    }
  });
};

export const useActivateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionSessionService.productionSessionService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionSessions'] });
    }
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productionSessionService.productionSessionService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionSessions'] });
    }
  });
};
