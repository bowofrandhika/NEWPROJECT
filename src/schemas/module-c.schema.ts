import { z } from 'zod';

export const dryerSchema = z.object({
  dryer_code: z.string().min(1, 'Dryer code is required').max(20),
  dryer_name: z.string().min(1, 'Dryer name is required').max(50),
  line_id: z.string().uuid().optional().or(z.literal('')),
  capacity: z.number().min(0).optional(),
  min_temp: z.number().optional(),
  max_temp: z.number().optional(),
  min_humidity: z.number().optional(),
  max_humidity: z.number().optional(),
  is_active: z.boolean().default(true)
});

export const trolleySchema = z.object({
  trolley_code: z.string().min(1, 'Trolley code is required').max(20),
  trolley_name: z.string().min(1, 'Trolley name is required').max(50),
  capacity: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true)
});

export const dryerMonitoringSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  dryer_id: z.string().uuid().optional().or(z.literal('')),
  monitoring_date: z.string().min(1, 'Monitoring date is required'),
  cycle_number: z.number().int().min(1).default(1),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  notes: z.string().optional()
});

export const dryerMonitoringRecordSchema = z.object({
  dryer_monitoring_id: z.string().uuid(),
  record_time: z.string().min(1, 'Record time is required'),
  inlet_temp: z.number().optional(),
  outlet_temp: z.number().optional(),
  product_temp: z.number().optional(),
  humidity: z.number().optional(),
  airflow: z.number().optional(),
  belt_speed: z.number().optional(),
  load_percentage: z.number().optional(),
  notes: z.string().optional()
});

export const trolleyMonitoringSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  trolley_id: z.string().uuid().optional().or(z.literal('')),
  load_time: z.string().optional(),
  unload_time: z.string().optional(),
  loaded_qty: z.number().int().min(0).default(0),
  unloaded_qty: z.number().int().min(0).default(0),
  dryer_id: z.string().uuid().optional().or(z.literal('')),
  cycle_number: z.number().int().min(1).default(1),
  status: z.enum(['EMPTY', 'LOADED', 'IN_DRYER', 'UNLOADED']).default('EMPTY'),
  notes: z.string().optional()
});

export const rejectRecordSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  reject_time: z.string().min(1, 'Reject time is required'),
  reject_type: z.string().min(1, 'Reject type is required').max(50),
  reject_category: z.string().max(50).optional(),
  reject_qty: z.number().int().min(0, 'Reject quantity must be 0 or greater'),
  reject_reason: z.string().optional(),
  dryer_id: z.string().uuid().optional().or(z.literal('')),
  trolley_id: z.string().uuid().optional().or(z.literal('')),
  process_step: z.string().max(50).optional(),
  disposition: z.enum(['SCRAP', 'REWORK', 'HOLD', 'RETURN']).optional(),
  status: z.enum(['RECORDED', 'VERIFIED', 'DISPOSED']).default('RECORDED')
});

export type DryerFormData = z.infer<typeof dryerSchema>;
export type TrolleyFormData = z.infer<typeof trolleySchema>;
export type DryerMonitoringFormData = z.infer<typeof dryerMonitoringSchema>;
export type DryerMonitoringRecordFormData = z.infer<typeof dryerMonitoringRecordSchema>;
export type TrolleyMonitoringFormData = z.infer<typeof trolleyMonitoringSchema>;
export type RejectRecordFormData = z.infer<typeof rejectRecordSchema>;
