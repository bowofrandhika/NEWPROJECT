// Database Types - Generated from Supabase Schema

export type UserRole = 'ADMIN' | 'SPV' | 'MANDOR' | 'DRYER_OPERATOR' | 'PACKING_OPERATOR';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type ProductionStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface AppUser {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  plant_code?: string;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  table_name: string;
  record_id?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Buyer {
  id: string;
  buyer_code: string;
  buyer_name: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description?: string;
  unit: string;
  buyer_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Line {
  id: string;
  line_code: string;
  line_name: string;
  line_type?: string;
  capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  shift_code: string;
  shift_name: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  wo_number: string;
  wo_date: string;
  buyer_id?: string;
  product_id?: string;
  batch_code: string;
  target_qty: number;
  completed_qty: number;
  status: ProductionStatus;
  priority?: number;
  notes?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProductionSession {
  id: string;
  session_number: string;
  work_order_id?: string;
  session_date: string;
  shift_id?: string;
  line_id?: string;
  buyer_id?: string;
  batch?: string;
  target_production: number;
  actual_production: number;
  status: ProductionStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Module A Types
export interface PreProductionChecklist {
  id: string;
  production_session_id: string;
  checklist_date: string;
  checked_by?: string;
  approved_by?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  pre_production_checklist_id: string;
  item_code?: string;
  item_name: string;
  category?: string;
  is_checked: boolean;
  checked_by?: string;
  checked_at?: string;
  remarks?: string;
  sort_order: number;
  created_at: string;
}

export interface ToolsInspection {
  id: string;
  production_session_id: string;
  tool_code?: string;
  tool_name: string;
  category?: string;
  condition_status: 'GOOD' | 'NEEDS_REPAIR' | 'REPLACED' | 'NOT_AVAILABLE';
  inspected_by?: string;
  inspected_at?: string;
  remarks?: string;
  created_at: string;
}

export interface ManpowerRecord {
  id: string;
  production_session_id: string;
  operator_id?: string;
  operator_name?: string;
  position?: string;
  attendance_status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'SICK';
  clock_in_time?: string;
  clock_out_time?: string;
  assigned_area?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

// Module B Types
export interface ProductionLog {
  id: string;
  production_session_id: string;
  log_time: string;
  process_step?: string;
  input_qty: number;
  output_qty: number;
  reject_qty: number;
  operator_id?: string;
  remarks?: string;
  created_at: string;
}

export interface MaterialIdentification {
  id: string;
  production_session_id: string;
  material_code: string;
  material_name: string;
  batch_number?: string;
  supplier?: string;
  received_qty: number;
  used_qty: number;
  unit: string;
  identification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  identified_by?: string;
  identified_at?: string;
  expiry_date?: string;
  storage_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessFlowControl {
  id: string;
  production_session_id: string;
  process_step: string;
  step_order: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ON_HOLD';
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  operator_id?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OutputSummary {
  id: string;
  production_session_id: string;
  summary_date: string;
  total_input: number;
  total_output: number;
  total_good: number;
  total_reject: number;
  total_rework: number;
  efficiency?: number;
  yield_percentage?: number;
  recorded_by?: string;
  approved_by?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelConsumption {
  id: string;
  production_session_id: string;
  fuel_type: string;
  opening_stock: number;
  received_qty: number;
  consumed_qty: number;
  closing_stock: number;
  unit: string;
  consumption_date: string;
  recorded_by?: string;
  notes?: string;
  created_at: string;
}

// Module C Types
export interface Dryer {
  id: string;
  dryer_code: string;
  dryer_name: string;
  line_id?: string;
  capacity?: number;
  min_temp?: number;
  max_temp?: number;
  min_humidity?: number;
  max_humidity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trolley {
  id: string;
  trolley_code: string;
  trolley_name: string;
  capacity?: number;
  is_active: boolean;
  created_at: string;
}

export interface DryerMonitoring {
  id: string;
  production_session_id: string;
  dryer_id?: string;
  monitoring_date: string;
  start_time?: string;
  end_time?: string;
  cycle_number: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  monitored_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DryerMonitoringRecord {
  id: string;
  dryer_monitoring_id: string;
  record_time: string;
  inlet_temp?: number;
  outlet_temp?: number;
  product_temp?: number;
  humidity?: number;
  airflow?: number;
  belt_speed?: number;
  load_percentage?: number;
  recorded_by?: string;
  notes?: string;
  created_at: string;
}

export interface TrolleyMonitoring {
  id: string;
  production_session_id: string;
  trolley_id?: string;
  load_time?: string;
  unload_time?: string;
  loaded_qty: number;
  unloaded_qty: number;
  dryer_id?: string;
  cycle_number: number;
  status: 'EMPTY' | 'LOADED' | 'IN_DRYER' | 'UNLOADED';
  monitored_by?: string;
  notes?: string;
  created_at: string;
}

export interface RejectRecord {
  id: string;
  production_session_id: string;
  reject_time: string;
  reject_type: string;
  reject_category?: string;
  reject_qty: number;
  reject_reason?: string;
  dryer_id?: string;
  trolley_id?: string;
  process_step?: string;
  disposition?: 'SCRAP' | 'REWORK' | 'HOLD' | 'RETURN';
  recorded_by?: string;
  verified_by?: string;
  status: 'RECORDED' | 'VERIFIED' | 'DISPOSED';
  created_at: string;
}

// Module D Types
export interface PalletTracking {
  id: string;
  production_session_id: string;
  pallet_code: string;
  qr_code?: string;
  product_id?: string;
  batch?: string;
  packing_date: string;
  packed_qty: number;
  gross_weight?: number;
  net_weight?: number;
  tare_weight?: number;
  number_of_bags?: number;
  status: 'PACKED' | 'STAGED' | 'SHIPPED' | 'ON_HOLD' | 'RELEASED';
  location?: string;
  inspector_id?: string;
  packed_by?: string;
  verified_by?: string;
  verified_at?: string;
  shipment_id?: string;
  shipped_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PackingRecord {
  id: string;
  pallet_tracking_id: string;
  production_session_id: string;
  bag_number: number;
  gross_weight?: number;
  net_weight?: number;
  grade?: string;
  packed_by?: string;
  packed_at: string;
  notes?: string;
  created_at: string;
}

// Module E & F Types
export interface BottleneckRecord {
  id: string;
  production_session_id: string;
  bottleneck_time: string;
  bottleneck_type: string;
  bottleneck_category?: string;
  location?: string;
  process_step?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact_duration_minutes: number;
  affected_qty?: number;
  description?: string;
  identified_by?: string;
  status: 'IDENTIFIED' | 'IN_PROGRESS' | 'RESOLVED' | 'MONITORING';
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CorrectiveAction {
  id: string;
  bottleneck_record_id?: string;
  downtime_record_id?: string;
  action_number: string;
  action_type: string;
  action_description: string;
  root_cause?: string;
  responsible_person_id?: string;
  due_date?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';
  completed_at?: string;
  completed_by?: string;
  verified_at?: string;
  verified_by?: string;
  effectiveness?: 'INEFFECTIVE' | 'PARTIAL' | 'EFFECTIVE' | 'VERY_EFFECTIVE';
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DowntimeRecord {
  id: string;
  production_session_id: string;
  downtime_start: string;
  downtime_end?: string;
  downtime_minutes: number;
  downtime_type: string;
  downtime_category?: string;
  equipment_id?: string;
  equipment_name?: string;
  location?: string;
  reason?: string;
  impact_description?: string;
  reported_by?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_description?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// MES Module Types
export interface MaintenanceSchedule {
  id: string;
  equipment_type: string;
  equipment_id?: string;
  equipment_name: string;
  equipment_code?: string;
  maintenance_type: 'PREVENTIVE' | 'PREDICTIVE' | 'ROUTINE';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  last_maintenance_date?: string;
  next_maintenance_date: string;
  estimated_duration_hours?: number;
  responsible_person_id?: string;
  maintenance_procedure?: string;
  parts_required?: string;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  downtime_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  maintenance_schedule_id?: string;
  equipment_id?: string;
  equipment_name: string;
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'ROUTINE';
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  actual_duration_hours?: number;
  performed_by?: string;
  verified_by?: string;
  verified_at?: string;
  work_performed?: string;
  parts_used?: string;
  issues_found?: string;
  recommendations?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  production_session_id?: string;
  pallet_tracking_id?: string;
  inspection_type: 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'OUTGOING';
  inspection_date: string;
  inspected_by?: string;
  sample_qty: number;
  passed_qty: number;
  failed_qty: number;
  pass_rate?: number;
  inspection_result: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  inspection_criteria?: string;
  observations?: string;
  inspector_notes?: string;
  approved_by?: string;
  approved_at?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface Defect {
  id: string;
  inspection_id?: string;
  production_session_id?: string;
  defect_time: string;
  defect_type: string;
  defect_category?: string;
  defect_severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  defect_qty: number;
  defect_description?: string;
  detected_by?: string;
  detected_location?: string;
  process_step?: string;
  root_cause?: string;
  corrective_action?: string;
  disposition?: 'ACCEPT' | 'REJECT' | 'REWORK' | 'SCRAP' | 'RETURN';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CAPA {
  id: string;
  capa_number: string;
  defect_id?: string;
  reject_record_id?: string;
  capa_type: 'CORRECTIVE' | 'PREVENTIVE' | 'BOTH';
  source?: 'CUSTOMER_COMPLAINT' | 'INTERNAL_AUDIT' | 'INSPECTION' | 'PROCESS_DEVIATION' | 'REJECT_ANALYSIS';
  problem_statement: string;
  root_cause_analysis?: string;
  immediate_action?: string;
  long_term_action?: string;
  preventive_action?: string;
  responsible_person_id?: string;
  due_date?: string;
  completion_date?: string;
  effectiveness_check_date?: string;
  effectiveness_result?: 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'EFFECTIVE' | 'VERIFIED';
  status: 'OPEN' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VERIFIED' | 'CLOSED' | 'CANCELLED';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OEERecord {
  id: string;
  production_session_id: string;
  line_id?: string;
  calculation_date: string;
  shift_id?: string;
  planned_production_time_minutes: number;
  operating_time_minutes: number;
  run_time_minutes: number;
  ideal_run_rate?: number;
  total_output: number;
  good_output: number;
  defect_output: number;
  availability?: number;
  performance?: number;
  quality?: number;
  oee?: number;
  planned_downtime_minutes?: number;
  unplanned_downtime_minutes?: number;
  speed_loss_minutes?: number;
  calculated_at: string;
  calculated_by?: string;
  notes?: string;
  created_at: string;
}

export interface BatchTraceability {
  id: string;
  production_session_id: string;
  work_order_id?: string;
  batch_code: string;
  parent_batch_id?: string;
  material_id?: string;
  input_qty?: number;
  input_date?: string;
  process_step?: string;
  line_id?: string;
  dryer_id?: string;
  dryer_cycle?: number;
  trolley_id?: string;
  output_qty?: number;
  output_date?: string;
  pallet_tracking_id?: string;
  quality_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HOLD';
  inspection_id?: string;
  trace_from?: string[];
  trace_to?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}
