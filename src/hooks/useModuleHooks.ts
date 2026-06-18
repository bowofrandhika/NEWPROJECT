import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as moduleAService from '../services/module-a.service';
import * as moduleBService from '../services/module-b.service';
import * as moduleCService from '../services/module-c.service';
import * as moduleDService from '../services/module-d.service';
import * as moduleEFService from '../services/module-e-f.service';
import * as mesService from '../services/mes.service';

// Module A hooks
export const usePreProductionChecklist = (sessionId: string) => {
  return useQuery({
    queryKey: ['preProductionChecklist', sessionId],
    queryFn: () => moduleAService.preProductionChecklistService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreatePreProductionChecklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleAService.preProductionChecklistService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['preProductionChecklist', variables.production_session_id] });
    }
  });
};

export const useApprovePreProductionChecklist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleAService.preProductionChecklistService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preProductionChecklist'] });
    }
  });
};

export const useChecklistItems = (checklistId: string) => {
  return useQuery({
    queryKey: ['checklistItems', checklistId],
    queryFn: () => moduleAService.checklistItemService.getByChecklistId(checklistId),
    enabled: !!checklistId
  });
};

export const useCheckChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isChecked }: { id: string; isChecked: boolean }) =>
      moduleAService.checklistItemService.checkItem(id, isChecked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
    }
  });
};

export const useToolsInspections = (sessionId: string) => {
  return useQuery({
    queryKey: ['toolsInspections', sessionId],
    queryFn: () => moduleAService.toolsInspectionService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateToolsInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleAService.toolsInspectionService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toolsInspections', variables.production_session_id] });
    }
  });
};

export const useManpowerRecords = (sessionId: string) => {
  return useQuery({
    queryKey: ['manpowerRecords', sessionId],
    queryFn: () => moduleAService.manpowerRecordService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateManpowerRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleAService.manpowerRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manpowerRecords', variables.production_session_id] });
    }
  });
};

// Module B hooks
export const useProductionLogs = (sessionId: string) => {
  return useQuery({
    queryKey: ['productionLogs', sessionId],
    queryFn: () => moduleBService.productionLogService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateProductionLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.productionLogService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productionLogs', variables.production_session_id] });
    }
  });
};

export const useMaterialIdentifications = (sessionId: string) => {
  return useQuery({
    queryKey: ['materialIdentifications', sessionId],
    queryFn: () => moduleBService.materialIdentificationService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateMaterialIdentification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.materialIdentificationService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materialIdentifications', variables.production_session_id] });
    }
  });
};

export const useProcessFlowControls = (sessionId: string) => {
  return useQuery({
    queryKey: ['processFlowControls', sessionId],
    queryFn: () => moduleBService.processFlowControlService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useStartProcessStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.processFlowControlService.startStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processFlowControls'] });
    }
  });
};

export const useCompleteProcessStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.processFlowControlService.completeStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processFlowControls'] });
    }
  });
};

export const useOutputSummary = (sessionId: string) => {
  return useQuery({
    queryKey: ['outputSummary', sessionId],
    queryFn: () => moduleBService.outputSummaryService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateOutputSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.outputSummaryService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outputSummary', variables.production_session_id] });
    }
  });
};

export const useApproveOutputSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.outputSummaryService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outputSummary'] });
    }
  });
};

export const useFuelConsumptions = (sessionId: string) => {
  return useQuery({
    queryKey: ['fuelConsumptions', sessionId],
    queryFn: () => moduleBService.fuelConsumptionService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateFuelConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleBService.fuelConsumptionService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fuelConsumptions', variables.production_session_id] });
    }
  });
};

// Module C hooks
export const useDryerMonitorings = (sessionId: string) => {
  return useQuery({
    queryKey: ['dryerMonitorings', sessionId],
    queryFn: () => moduleCService.dryerMonitoringService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useDryerMonitoringRecords = (monitoringId: string) => {
  return useQuery({
    queryKey: ['dryerMonitoringRecords', monitoringId],
    queryFn: () => moduleCService.dryerMonitoringRecordService.getByMonitoringId(monitoringId),
    enabled: !!monitoringId
  });
};

export const useCreateDryerMonitoring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleCService.dryerMonitoringService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dryerMonitorings', variables.production_session_id] });
    }
  });
};

export const useCreateDryerMonitoringRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleCService.dryerMonitoringRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dryerMonitoringRecords', variables.dryer_monitoring_id] });
    }
  });
};

export const useTrolleyMonitorings = (sessionId: string) => {
  return useQuery({
    queryKey: ['trolleyMonitorings', sessionId],
    queryFn: () => moduleCService.trolleyMonitoringService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateTrolleyMonitoring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleCService.trolleyMonitoringService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trolleyMonitorings', variables.production_session_id] });
    }
  });
};

export const useRejectRecords = (sessionId: string) => {
  return useQuery({
    queryKey: ['rejectRecords', sessionId],
    queryFn: () => moduleCService.rejectRecordService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateRejectRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleCService.rejectRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rejectRecords', variables.production_session_id] });
    }
  });
};

// Module D hooks
export const usePalletTrackings = (sessionId: string) => {
  return useQuery({
    queryKey: ['palletTrackings', sessionId],
    queryFn: () => moduleDService.palletTrackingService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const usePalletTracking = (id: string) => {
  return useQuery({
    queryKey: ['palletTracking', id],
    queryFn: () => moduleDService.palletTrackingService.getById(id),
    enabled: !!id
  });
};

export const useCreatePalletTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleDService.palletTrackingService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['palletTrackings', variables.production_session_id] });
    }
  });
};

export const useVerifyPallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleDService.palletTrackingService.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['palletTrackings'] });
      queryClient.invalidateQueries({ queryKey: ['palletTracking'] });
    }
  });
};

export const usePackingRecords = (palletId: string) => {
  return useQuery({
    queryKey: ['packingRecords', palletId],
    queryFn: () => moduleDService.packingRecordService.getByPalletId(palletId),
    enabled: !!palletId
  });
};

export const useCreatePackingRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleDService.packingRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packingRecords', variables.pallet_tracking_id] });
    }
  });
};

// Module E & F hooks
export const useBottleneckRecords = (sessionId: string) => {
  return useQuery({
    queryKey: ['bottleneckRecords', sessionId],
    queryFn: () => moduleEFService.bottleneckRecordService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateBottleneckRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleEFService.bottleneckRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bottleneckRecords', variables.production_session_id] });
    }
  });
};

export const useResolveBottleneck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      moduleEFService.bottleneckRecordService.resolve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bottleneckRecords'] });
    }
  });
};

export const useCorrectiveActions = (bottleneckId?: string) => {
  return useQuery({
    queryKey: ['correctiveActions', bottleneckId],
    queryFn: () => bottleneckId
      ? moduleEFService.correctiveActionService.getByBottleneckId(bottleneckId)
      : Promise.resolve([]),
    enabled: !!bottleneckId
  });
};

export const useCompleteCorrectiveAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleEFService.correctiveActionService.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correctiveActions'] });
    }
  });
};

export const useDowntimeRecords = (sessionId: string) => {
  return useQuery({
    queryKey: ['downtimeRecords', sessionId],
    queryFn: () => moduleEFService.downtimeRecordService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateDowntimeRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleEFService.downtimeRecordService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['downtimeRecords', variables.production_session_id] });
    }
  });
};

export const useAcknowledgeDowntime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moduleEFService.downtimeRecordService.acknowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downtimeRecords'] });
    }
  });
};

export const useResolveDowntime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      moduleEFService.downtimeRecordService.resolve(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downtimeRecords'] });
    }
  });
};

// MES hooks
export const useMaintenanceSchedules = (filters?: { status?: string; equipmentId?: string }) => {
  return useQuery({
    queryKey: ['maintenanceSchedules', filters],
    queryFn: () => mesService.maintenanceScheduleService.getAll(filters)
  });
};

export const useOverdueMaintenance = () => {
  return useQuery({
    queryKey: ['overdueMaintenance'],
    queryFn: mesService.maintenanceScheduleService.getOverdue
  });
};

export const useCreateMaintenanceSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.maintenanceScheduleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
    }
  });
};

export const useMaintenanceRecords = (filters?: { status?: string; equipmentId?: string }) => {
  return useQuery({
    queryKey: ['maintenanceRecords', filters],
    queryFn: () => mesService.maintenanceRecordService.getAll(filters)
  });
};

export const useInspections = (filters?: { status?: string; type?: string }) => {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: () => mesService.inspectionService.getAll(filters)
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.inspectionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  });
};

export const useApproveInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.inspectionService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  });
};

export const useDefects = (filters?: { status?: string; severity?: string }) => {
  return useQuery({
    queryKey: ['defects', filters],
    queryFn: () => mesService.defectService.getAll(filters)
  });
};

export const useCreateDefect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.defectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    }
  });
};

export const useResolveDefect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      mesService.defectService.resolve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    }
  });
};

export const useCAPAs = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: ['capas', filters],
    queryFn: () => mesService.capaService.getAll(filters)
  });
};

export const useCreateCAPA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.capaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
    }
  });
};

export const useOEERecord = (sessionId: string) => {
  return useQuery({
    queryKey: ['oeeRecord', sessionId],
    queryFn: () => mesService.oeeService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateOEERecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.oeeService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['oeeRecord', variables.production_session_id] });
    }
  });
};

export const useOEESummary = (filters?: { startDate?: string; endDate?: string; lineId?: string }) => {
  return useQuery({
    queryKey: ['oeeSummary', filters],
    queryFn: () => mesService.oeeService.getSummary(filters)
  });
};

export const useBatchTraceabilities = (sessionId: string) => {
  return useQuery({
    queryKey: ['batchTraceabilities', sessionId],
    queryFn: () => mesService.batchTraceabilityService.getBySessionId(sessionId),
    enabled: !!sessionId
  });
};

export const useCreateBatchTraceability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mesService.batchTraceabilityService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batchTraceabilities', variables.production_session_id] });
    }
  });
};
