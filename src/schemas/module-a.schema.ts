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

// New session checklist items with OK/NG conditions
export const sessionChecklistItemSchema = z.object({
  production_session_id: z.string().uuid('Production session is required'),
  item_name: z.string().min(1, 'Item name is required'),
  initial_condition: z.enum(['OK', 'NG']).optional(),
  final_condition: z.enum(['OK', 'NG']).optional(),
  initial_remarks: z.string().optional(),
  final_remarks: z.string().optional(),
  sort_order: z.number().int().default(0)
});

export const checklistItemUpdateSchema = z.object({
  initial_condition: z.enum(['OK', 'NG']).optional(),
  final_condition: z.enum(['OK', 'NG']).optional(),
  initial_remarks: z.string().optional(),
  final_remarks: z.string().optional()
}).refine((data) => {
  // If NG, remarks must be filled
  if (data.initial_condition === 'NG' && (!data.initial_remarks || data.initial_remarks.trim() === '')) {
    return false;
  }
  if (data.final_condition === 'NG' && (!data.final_remarks || data.final_remarks.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Remarks must be filled when condition is NG',
  path: ['initial_remarks']
});

export type PreProductionChecklistFormData = z.infer<typeof preProductionChecklistSchema>;
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
export type ToolsInspectionFormData = z.infer<typeof toolsInspectionSchema>;
export type ManpowerRecordFormData = z.infer<typeof manpowerRecordSchema>;
export type SessionChecklistItemFormData = z.infer<typeof sessionChecklistItemSchema>;
export type ChecklistItemUpdateFormData = z.infer<typeof checklistItemUpdateSchema>;
