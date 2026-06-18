import { z } from 'zod';

export const preProductionChecklistSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  checklist_date: z.string().min(1, 'Checklist date is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  notes: z.string().optional()
});

export const checklistItemSchema = z.object({
  pre_production_checklist_id: z.string().uuid(),
  item_code: z.string().max(30).optional(),
  item_name: z.string().min(1, 'Item name is required').max(100),
  category: z.string().max(50).optional(),
  is_checked: z.boolean().default(false),
  remarks: z.string().optional(),
  sort_order: z.number().int().default(0)
});

export const toolsInspectionSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  tool_code: z.string().max(30).optional(),
  tool_name: z.string().min(1, 'Tool name is required').max(100),
  category: z.string().max(50).optional(),
  condition_status: z.enum(['GOOD', 'NEEDS_REPAIR', 'REPLACED', 'NOT_AVAILABLE']),
  inspected_at: z.string().optional(),
  remarks: z.string().optional()
});

export const manpowerRecordSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  operator_id: z.string().uuid().optional().or(z.literal('')),
  operator_name: z.string().max(100).optional(),
  position: z.string().max(50).optional(),
  attendance_status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'SICK']).default('PRESENT'),
  clock_in_time: z.string().optional(),
  clock_out_time: z.string().optional(),
  assigned_area: z.string().max(50).optional(),
  remarks: z.string().optional()
});

export type PreProductionChecklistFormData = z.infer<typeof preProductionChecklistSchema>;
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
export type ToolsInspectionFormData = z.infer<typeof toolsInspectionSchema>;
export type ManpowerRecordFormData = z.infer<typeof manpowerRecordSchema>;
