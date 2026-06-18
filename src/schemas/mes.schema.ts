import { z } from 'zod';

export const maintenanceScheduleSchema = z.object({
  equipment_type: z.string().min(1, 'Equipment type is required').max(50),
  equipment_id: z.string().uuid().optional().or(z.literal('')),
  equipment_name: z.string().min(1, 'Equipment name is required').max(100),
  equipment_code: z.string().max(50).optional(),
  maintenance_type: z.enum(['PREVENTIVE', 'PREDICTIVE', 'ROUTINE']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().min(1, 'Next maintenance date is required'),
  estimated_duration_hours: z.number().int().min(0).optional(),
  responsible_person_id: z.string().uuid().optional().or(z.literal('')),
  maintenance_procedure: z.string().optional(),
  parts_required: z.string().optional(),
  status: z.enum(['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('ACTIVE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
});

export const maintenanceRecordSchema = z.object({
  maintenance_schedule_id: z.string().uuid().optional().or(z.literal('')),
  equipment_id: z.string().uuid().optional().or(z.literal('')),
  equipment_name: z.string().min(1, 'Equipment name is required').max(100),
  maintenance_type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'ROUTINE']),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  actual_start_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  actual_duration_hours: z.number().int().min(0).optional(),
  work_performed: z.string().optional(),
  parts_used: z.string().optional(),
  issues_found: z.string().optional(),
  recommendations: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED']).default('PLANNED'),
  cost: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const inspectionSchema = z.object({
  production_session_id: z.string().uuid().optional().or(z.literal('')),
  pallet_tracking_id: z.string().uuid().optional().or(z.literal('')),
  inspection_type: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL', 'OUTGOING']),
  inspection_date: z.string().min(1, 'Inspection date is required'),
  sample_qty: z.number().int().min(0).default(0),
  passed_qty: z.number().int().min(0).default(0),
  failed_qty: z.number().int().min(0).default(0),
  inspection_result: z.enum(['PENDING', 'PASSED', 'FAILED', 'CONDITIONAL']).default('PENDING'),
  inspection_criteria: z.string().optional(),
  observations: z.string().optional(),
  inspector_notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).default('DRAFT')
});

export const defectSchema = z.object({
  inspection_id: z.string().uuid().optional().or(z.literal('')),
  production_session_id: z.string().uuid().optional().or(z.literal('')),
  defect_time: z.string().min(1, 'Defect time is required'),
  defect_type: z.string().min(1, 'Defect type is required').max(50),
  defect_category: z.string().max(50).optional(),
  defect_severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MINOR'),
  defect_qty: z.number().int().min(0, 'Defect quantity must be 0 or greater'),
  defect_description: z.string().optional(),
  detected_location: z.string().max(50).optional(),
  process_step: z.string().max(50).optional(),
  root_cause: z.string().optional(),
  corrective_action: z.string().optional(),
  disposition: z.enum(['ACCEPT', 'REJECT', 'REWORK', 'SCRAP', 'RETURN']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
  resolution_notes: z.string().optional()
});

export const capaSchema = z.object({
  capa_number: z.string().min(1, 'CAPA number is required').max(30),
  defect_id: z.string().uuid().optional().or(z.literal('')),
  reject_record_id: z.string().uuid().optional().or(z.literal('')),
  capa_type: z.enum(['CORRECTIVE', 'PREVENTIVE', 'BOTH']),
  source: z.enum(['CUSTOMER_COMPLAINT', 'INTERNAL_AUDIT', 'INSPECTION', 'PROCESS_DEVIATION', 'REJECT_ANALYSIS']).optional(),
  problem_statement: z.string().min(1, 'Problem statement is required'),
  root_cause_analysis: z.string().optional(),
  immediate_action: z.string().optional(),
  long_term_action: z.string().optional(),
  preventive_action: z.string().optional(),
  responsible_person_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED', 'CLOSED', 'CANCELLED']).default('OPEN'),
  verification_notes: z.string().optional(),
  notes: z.string().optional()
});

export const oeeRecordSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  line_id: z.string().uuid().optional().or(z.literal('')),
  calculation_date: z.string().min(1, 'Calculation date is required'),
  shift_id: z.string().uuid().optional().or(z.literal('')),
  planned_production_time_minutes: z.number().int().min(0).default(0),
  operating_time_minutes: z.number().int().min(0).default(0),
  run_time_minutes: z.number().int().min(0).default(0),
  ideal_run_rate: z.number().min(0).optional(),
  total_output: z.number().int().min(0).default(0),
  good_output: z.number().int().min(0).default(0),
  defect_output: z.number().int().min(0).default(0),
  planned_downtime_minutes: z.number().int().min(0).optional(),
  unplanned_downtime_minutes: z.number().int().min(0).optional(),
  speed_loss_minutes: z.number().int().min(0).optional(),
  notes: z.string().optional()
});

export const batchTraceabilitySchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  work_order_id: z.string().uuid().optional().or(z.literal('')),
  batch_code: z.string().min(1, 'Batch code is required').max(50),
  parent_batch_id: z.string().uuid().optional().or(z.literal('')),
  material_id: z.string().uuid().optional().or(z.literal('')),
  input_qty: z.number().min(0).optional(),
  process_step: z.string().max(50).optional(),
  line_id: z.string().uuid().optional().or(z.literal('')),
  dryer_id: z.string().uuid().optional().or(z.literal('')),
  dryer_cycle: z.number().int().optional(),
  trolley_id: z.string().uuid().optional().or(z.literal('')),
  output_qty: z.number().min(0).optional(),
  pallet_tracking_id: z.string().uuid().optional().or(z.literal('')),
  quality_status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HOLD']).optional(),
  inspection_id: z.string().uuid().optional().or(z.literal(''))
});

export type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>;
export type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
export type DefectFormData = z.infer<typeof defectSchema>;
export type CAPAFormData = z.infer<typeof capaSchema>;
export type OEERecordFormData = z.infer<typeof oeeRecordSchema>;
export type BatchTraceabilityFormData = z.infer<typeof batchTraceabilitySchema>;
