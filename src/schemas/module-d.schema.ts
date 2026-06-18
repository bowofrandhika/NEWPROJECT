import { z } from 'zod';

export const palletTrackingSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  pallet_code: z.string().min(1, 'Pallet code is required').max(30),
  product_id: z.string().uuid().optional().or(z.literal('')),
  batch: z.string().max(50).optional(),
  packing_date: z.string().min(1, 'Packing date is required'),
  packed_qty: z.number().int().min(0, 'Packed quantity must be 0 or greater'),
  gross_weight: z.number().min(0).optional(),
  net_weight: z.number().min(0).optional(),
  tare_weight: z.number().min(0).default(0),
  number_of_bags: z.number().int().min(0).default(0),
  status: z.enum(['PACKED', 'STAGED', 'SHIPPED', 'ON_HOLD', 'RELEASED']).default('PACKED'),
  location: z.string().max(50).optional(),
  notes: z.string().optional()
});

export const packingRecordSchema = z.object({
  pallet_tracking_id: z.string().uuid('Pallet is required'),
  production_session_id: z.string().uuid('Production session is required'),
  bag_number: z.number().int().min(0).default(0),
  gross_weight: z.number().min(0).optional(),
  net_weight: z.number().min(0).optional(),
  grade: z.string().max(20).optional(),
  notes: z.string().optional()
});

export type PalletTrackingFormData = z.infer<typeof palletTrackingSchema>;
export type PackingRecordFormData = z.infer<typeof packingRecordSchema>;
