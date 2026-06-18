import { z } from 'zod';

export const bottleneckRecordSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  bottleneck_time: z.string().min(1, 'Bottleneck time is required'),
  bottleneck_type: z.string().min(1, 'Bottleneck type is required').max(50),
  bottleneck_category: z.string().max(50).optional(),
  location: z.string().max(50).optional(),
  process_step: z.string().max(50).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  impact_duration_minutes: z.number().int().min(0).default(0),
  affected_qty: z.number().int().min(0).optional(),
  description: z.string().optional(),
  status: z.enum(['IDENTIFIED', 'IN_PROGRESS', 'RESOLVED', 'MONITORING']).default('IDENTIFIED'),
  resolution_notes: z.string().optional()
});

export const correctiveActionSchema = z.object({
  bottleneck_record_id: z.string().uuid().optional().or(z.literal('')),
  downtime_record_id: z.string().uuid().optional().or(z.literal('')),
  action_number: z.string().min(1, 'Action number is required').max(30),
  action_type: z.string().min(1, 'Action type is required').max(50),
  action_description: z.string().min(1, 'Action description is required'),
  root_cause: z.string().max(100).optional(),
  responsible_person_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED']).default('PENDING'),
  effectiveness: z.enum(['INEFFECTIVE', 'PARTIAL', 'EFFECTIVE', 'VERY_EFFECTIVE']).optional(),
  follow_up_notes: z.string().optional()
});

export const downtimeRecordSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  downtime_start: z.string().min(1, 'Downtime start is required'),
  downtime_end: z.string().optional(),
  downtime_minutes: z.number().int().min(0).default(0),
  downtime_type: z.string().min(1, 'Downtime type is required').max(50),
  downtime_category: z.string().max(50).optional(),
  equipment_id: z.string().uuid().optional().or(z.literal('')),
  equipment_name: z.string().max(100).optional(),
  location: z.string().max(50).optional(),
  reason: z.string().optional(),
  impact_description: z.string().optional(),
  status: z.enum(['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('REPORTED'),
  resolution_description: z.string().optional()
});

export const rootCauseSchema = z.object({
  downtime_record_id: z.string().uuid().optional().or(z.literal('')),
  bottleneck_record_id: z.string().uuid().optional().or(z.literal('')),
  root_cause_category: z.string().max(50).optional(),
  root_cause_description: z.string().min(1, 'Root cause description is required'),
  contributing_factors: z.string().optional(),
  analysis_method: z.enum(['5_WHYS', 'FISHBONE', 'FAULT_TREE', 'OTHER']).optional(),
  analysis_method_details: z.string().optional(),
  preventive_action: z.string().optional()
});

export type BottleneckRecordFormData = z.infer<typeof bottleneckRecordSchema>;
export type CorrectiveActionFormData = z.infer<typeof correctiveActionSchema>;
export type DowntimeRecordFormData = z.infer<typeof downtimeRecordSchema>;
export type RootCauseFormData = z.infer<typeof rootCauseSchema>;
