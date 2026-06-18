import { z } from 'zod';

export const productionLogSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  log_time: z.string().min(1, 'Log time is required'),
  process_step: z.string().max(50).optional(),
  input_qty: z.number().int().min(0).default(0),
  output_qty: z.number().int().min(0).default(0),
  reject_qty: z.number().int().min(0).default(0),
  remarks: z.string().optional()
});

export const materialIdentificationSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  material_code: z.string().min(1, 'Material code is required').max(50),
  material_name: z.string().min(1, 'Material name is required').max(100),
  batch_number: z.string().max(50).optional(),
  supplier: z.string().max(100).optional(),
  received_qty: z.number().min(0).default(0),
  used_qty: z.number().min(0).default(0),
  unit: z.string().default('KG'),
  identification_status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('VERIFIED'),
  expiry_date: z.string().optional(),
  storage_location: z.string().max(50).optional(),
  notes: z.string().optional()
});

export const processFlowControlSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  process_step: z.string().min(1, 'Process step is required').max(50),
  step_order: z.number().int().min(0).default(0),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ON_HOLD']).default('PENDING'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  pressure: z.number().optional(),
  notes: z.string().optional()
});

export const outputSummarySchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  summary_date: z.string().min(1, 'Summary date is required'),
  total_input: z.number().int().min(0).default(0),
  total_output: z.number().int().min(0).default(0),
  total_good: z.number().int().min(0).default(0),
  total_reject: z.number().int().min(0).default(0),
  total_rework: z.number().int().min(0).default(0),
  notes: z.string().optional()
});

export const fuelConsumptionSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  fuel_type: z.string().min(1, 'Fuel type is required').max(30),
  opening_stock: z.number().min(0).default(0),
  received_qty: z.number().min(0).default(0),
  consumed_qty: z.number().min(0).default(0),
  closing_stock: z.number().min(0).default(0),
  unit: z.string().default('LITER'),
  consumption_date: z.string().min(1, 'Consumption date is required'),
  notes: z.string().optional()
});

export type ProductionLogFormData = z.infer<typeof productionLogSchema>;
export type MaterialIdentificationFormData = z.infer<typeof materialIdentificationSchema>;
export type ProcessFlowControlFormData = z.infer<typeof processFlowControlSchema>;
export type OutputSummaryFormData = z.infer<typeof outputSummarySchema>;
export type FuelConsumptionFormData = z.infer<typeof fuelConsumptionSchema>;
