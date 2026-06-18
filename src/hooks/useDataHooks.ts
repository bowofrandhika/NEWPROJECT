import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '../services/user.service';
import * as buyerService from '../services/master-data.service';
import * as productService from '../services/master-data.service';
import * as lineService from '../services/master-data.service';
import * as shiftService from '../services/master-data.service';
import * as dryerService from '../services/master-data.service';
import * as trolleyService from '../services/master-data.service';

// User hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.userService.getAll
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.userService.getById(id),
    enabled: !!id
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.userService.getCurrentUserProfile
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userService.userService.update>[1] }) =>
      userService.userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

// Buyer hooks
export const useBuyers = () => {
  return useQuery({
    queryKey: ['buyers'],
    queryFn: buyerService.buyerService.getAll
  });
};

export const useBuyer = (id: string) => {
  return useQuery({
    queryKey: ['buyers', id],
    queryFn: () => buyerService.buyerService.getById(id),
    enabled: !!id
  });
};

export const useCreateBuyer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buyerService.buyerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
};

export const useUpdateBuyer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof buyerService.buyerService.update>[1] }) =>
      buyerService.buyerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
};

export const useDeleteBuyer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buyerService.buyerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
};

// Product hooks
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productService.productService.getAll
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.productService.getById(id),
    enabled: !!id
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof productService.productService.update>[1] }) =>
      productService.productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

// Line hooks
export const useLines = () => {
  return useQuery({
    queryKey: ['lines'],
    queryFn: lineService.lineService.getAll
  });
};

export const useLine = (id: string) => {
  return useQuery({
    queryKey: ['lines', id],
    queryFn: () => lineService.lineService.getById(id),
    enabled: !!id
  });
};

export const useCreateLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lineService.lineService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    }
  });
};

export const useUpdateLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof lineService.lineService.update>[1] }) =>
      lineService.lineService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    }
  });
};

export const useDeleteLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lineService.lineService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines'] });
    }
  });
};

// Shift hooks
export const useShifts = () => {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: shiftService.shiftService.getAll
  });
};

export const useShift = (id: string) => {
  return useQuery({
    queryKey: ['shifts', id],
    queryFn: () => shiftService.shiftService.getById(id),
    enabled: !!id
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftService.shiftService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof shiftService.shiftService.update>[1] }) =>
      shiftService.shiftService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftService.shiftService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });
};

// Dryer hooks
export const useDryers = () => {
  return useQuery({
    queryKey: ['dryers'],
    queryFn: dryerService.dryerService.getAll
  });
};

export const useDryer = (id: string) => {
  return useQuery({
    queryKey: ['dryers', id],
    queryFn: () => dryerService.dryerService.getById(id),
    enabled: !!id
  });
};

export const useCreateDryer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dryerService.dryerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dryers'] });
    }
  });
};

export const useUpdateDryer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dryerService.dryerService.update>[1] }) =>
      dryerService.dryerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dryers'] });
    }
  });
};

export const useDeleteDryer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dryerService.dryerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dryers'] });
    }
  });
};

// Trolley hooks
export const useTrolleys = () => {
  return useQuery({
    queryKey: ['trolleys'],
    queryFn: trolleyService.trolleyService.getAll
  });
};

export const useTrolley = (id: string) => {
  return useQuery({
    queryKey: ['trolleys', id],
    queryFn: () => trolleyService.trolleyService.getById(id),
    enabled: !!id
  });
};

export const useCreateTrolley = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trolleyService.trolleyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trolleys'] });
    }
  });
};

export const useUpdateTrolley = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof trolleyService.trolleyService.update>[1] }) =>
      trolleyService.trolleyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trolleys'] });
    }
  });
};

export const useDeleteTrolley = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trolleyService.trolleyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trolleys'] });
    }
  });
};
