import { z } from 'zod';

export const buyerSchema = z.object({
  buyer_code: z.string().min(1, 'Buyer code is required').max(20),
  buyer_name: z.string().min(1, 'Buyer name is required').max(100),
  address: z.string().optional(),
  contact_person: z.string().max(100).optional(),
  contact_phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  is_active: z.boolean().default(true)
});

export const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required').max(20),
  product_name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().optional(),
  unit: z.string().default('KG'),
  buyer_id: z.string().uuid().optional().or(z.literal('')),
  is_active: z.boolean().default(true)
});

export const lineSchema = z.object({
  line_code: z.string().min(1, 'Line code is required').max(20),
  line_name: z.string().min(1, 'Line name is required').max(50),
  line_type: z.string().max(50).optional(),
  capacity: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true)
});

export const shiftSchema = z.object({
  shift_code: z.string().min(1, 'Shift code is required').max(10),
  shift_name: z.string().min(1, 'Shift name is required').max(20),
  shift_type: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  is_active: z.boolean().default(true)
});

export const workOrderSchema = z.object({
  wo_number: z.string().min(1, 'WO number is required').max(30),
  wo_date: z.string().min(1, 'WO date is required'),
  buyer_id: z.string().uuid().optional().or(z.literal('')),
  buyer: z.enum(['Belshina', 'Kamatyres', 'SNI']).optional(),
  product_id: z.string().uuid().optional().or(z.literal('')),
  deadline_date: z.string().min(1, 'Deadline date is required'),
  packaging: z.enum(['SW', 'MB', 'LB']).optional(),
  quantity_kg: z.number().min(0, 'Quantity in KG must be 0 or greater').default(0),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  priority: z.number().int().min(1).max(10).default(5),
  notes: z.string().optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional()
});

export const productionSessionSchema = z.object({
  session_number: z.string().min(1, 'Session number is required').max(30),
  work_order_id: z.string().uuid().optional().or(z.literal('')),
  session_date: z.string().min(1, 'Session date is required'),
  shift_id: z.string().uuid().optional().or(z.literal('')),
  shift: z.enum(['Morning', 'Afternoon']).optional(),
  line_id: z.string().uuid().optional().or(z.literal('')),
  line: z.enum(['A', 'B', 'AB']).optional(),
  buyer_id: z.string().uuid().optional().or(z.literal('')),
  batch: z.string().max(50).optional(),
  packaging: z.enum(['SW', 'MB', 'LB']).optional(),
  target_production: z.number().int().min(0, 'Target production must be 0 or greater').default(0),
  production_target_kg: z.number().min(0, 'Production target in KG must be 0 or greater').default(0),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  notes: z.string().optional()
});

export type BuyerFormData = z.infer<typeof buyerSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type LineFormData = z.infer<typeof lineSchema>;
export type ShiftFormData = z.infer<typeof shiftSchema>;
export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type ProductionSessionFormData = z.infer<typeof productionSessionSchema>;
