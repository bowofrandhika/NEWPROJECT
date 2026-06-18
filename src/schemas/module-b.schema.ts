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

// New Production Log Details schema (multi-tab)
export const productionLogDetailsSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  // Tab 1: Session
  foreman_id: z.string().uuid().optional().or(z.literal('')),
  production_start_time: z.string().optional(),
  production_end_time: z.string().optional(),
  // Tab 2: Material
  material_room: z.string().max(50).optional(),
  material_deck: z.string().max(50).optional(),
  material_update_date: z.string().optional(),
  material_drying_time_days: z.number().int().optional(),
  material_visual_condition: z.enum(['Clean', 'Moderate', 'Dirty']).optional(),
  material_line_cleaning: z.enum(['Clean', 'Moderate', 'Dirty']).optional(),
  material_remarks: z.string().optional(),
  // Tab 3: Process Flow
  avg_cake_weight: z.number().min(0).optional(),
  variation: z.string().max(100).optional(),
  process_remarks: z.string().optional(),
  bale_count: z.number().int().min(0).default(0),
  pallet_count: z.number().int().min(0).default(0),
  total_weight_kg: z.number().min(0).default(0),
  // Tab 4: Fuel
  diesel_start_l: z.number().min(0).optional(),
  diesel_end_l: z.number().min(0).optional(),
  diesel_consumption_l: z.number().min(0).optional(),
  pks_consumption_kg: z.number().min(0).optional()
});

export type ProductionLogFormData = z.infer<typeof productionLogSchema>;
export type MaterialIdentificationFormData = z.infer<typeof materialIdentificationSchema>;
export type ProcessFlowControlFormData = z.infer<typeof processFlowControlSchema>;
export type OutputSummaryFormData = z.infer<typeof outputSummarySchema>;
export type FuelConsumptionFormData = z.infer<typeof fuelConsumptionSchema>;
export type ProductionLogDetailsFormData = z.infer<typeof productionLogDetailsSchema>;
