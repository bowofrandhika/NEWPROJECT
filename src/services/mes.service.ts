import supabase from '../lib/supabase';
import type {
  MaintenanceSchedule,
  MaintenanceRecord,
  Inspection,
  Defect,
  CAPA,
  OEERecord,
  BatchTraceability
} from '../types/database';

// Maintenance Services
export const maintenanceScheduleService = {
  async getAll(filters?: { status?: string; equipmentId?: string }): Promise<MaintenanceSchedule[]> {
    let query = supabase
      .from('maintenance_schedules')
      .select('*')
      .order('next_maintenance_date', { ascending: true });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.equipmentId) query = query.eq('equipment_id', filters.equipmentId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<MaintenanceSchedule | null> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceSchedule> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .insert(schedule)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, schedule: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .update({ ...schedule, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async complete(id: string): Promise<MaintenanceSchedule> {
    const today = new Date().toISOString().split('T')[0];
    return this.update(id, {
      status: 'COMPLETED',
      last_maintenance_date: today
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async getOverdue(): Promise<MaintenanceSchedule[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .lt('next_maintenance_date', today)
      .eq('status', 'ACTIVE');
    if (error) throw error;
    return data || [];
  }
};

export const maintenanceRecordService = {
  async getAll(filters?: { status?: string; equipmentId?: string }): Promise<MaintenanceRecord[]> {
    let query = supabase
      .from('maintenance_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.equipmentId) query = query.eq('equipment_id', filters.equipmentId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(record: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async start(id: string): Promise<MaintenanceRecord> {
    return this.update(id, {
      status: 'IN_PROGRESS',
      actual_start_date: new Date().toISOString().split('T')[0]
    });
  },

  async complete(id: string, workPerformed?: string): Promise<MaintenanceRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'COMPLETED',
      actual_end_date: new Date().toISOString().split('T')[0],
      work_performed: workPerformed
    });
  },

  async verify(id: string): Promise<MaintenanceRecord> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'VERIFIED',
      verified_by: user?.id,
      verified_at: new Date().toISOString()
    });
  }
};

// Quality Services
export const inspectionService = {
  async getAll(filters?: { status?: string; type?: string }): Promise<Inspection[]> {
    let query = supabase
      .from('inspections')
      .select('*, production_sessions(session_number)')
      .order('inspection_date', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('inspection_type', filters.type);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(inspection: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>): Promise<Inspection> {
    const { data: { user } } = await supabase.auth.getUser();

    const sampleQty = inspection.sample_qty || 0;
    const passedQty = inspection.passed_qty || 0;
    const failedQty = inspection.failed_qty || 0;
    const passRate = sampleQty > 0 ? Math.round((passedQty / sampleQty) * 100 * 100) / 100 : 0;

    let result: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL' = 'PENDING';
    if (passRate >= 95) result = 'PASSED';
    else if (passRate >= 80) result = 'CONDITIONAL';
    else result = 'FAILED';

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        ...inspection,
        inspected_by: user?.id,
        pass_rate: passRate,
        inspection_result: result
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, inspection: Partial<Inspection>): Promise<Inspection> {
    const { data, error } = await supabase
      .from('inspections')
      .update({ ...inspection, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async approve(id: string): Promise<Inspection> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'APPROVED',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) throw error;
  }
};

export const defectService = {
  async getByInspectionId(inspectionId: string): Promise<Defect[]> {
    const { data, error } = await supabase
      .from('defects')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('defect_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAll(filters?: { status?: string; severity?: string }): Promise<Defect[]> {
    let query = supabase
      .from('defects')
      .select('*')
      .order('defect_time', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.severity) query = query.eq('defect_severity', filters.severity);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(defect: Omit<Defect, 'id' | 'created_at' | 'updated_at'>): Promise<Defect> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('defects')
      .insert({
        ...defect,
        detected_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, defect: Partial<Defect>): Promise<Defect> {
    const { data, error } = await supabase
      .from('defects')
      .update({ ...defect, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async resolve(id: string, notes?: string): Promise<Defect> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'RESOLVED',
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes
    });
  },

  async close(id: string): Promise<Defect> {
    return this.update(id, { status: 'CLOSED' });
  }
};

export const capaService = {
  async getAll(filters?: { status?: string }): Promise<CAPA[]> {
    let query = supabase
      .from('capa')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<CAPA | null> {
    const { data, error } = await supabase
      .from('capa')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(capa: Omit<CAPA, 'id' | 'created_at' | 'updated_at'>): Promise<CAPA> {
    const { data, error } = await supabase
      .from('capa')
      .insert(capa)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, capa: Partial<CAPA>): Promise<CAPA> {
    const { data, error } = await supabase
      .from('capa')
      .update({ ...capa, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async implement(id: string): Promise<CAPA> {
    return this.update(id, {
      status: 'IMPLEMENTED',
      completion_date: new Date().toISOString().split('T')[0]
    });
  },

  async verify(id: string, result: 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'EFFECTIVE' | 'VERIFIED'): Promise<CAPA> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.update(id, {
      status: 'VERIFIED',
      effectiveness_result: result,
      verified_by: user?.id,
      verified_at: new Date().toISOString()
    });
  },

  async generateCAPANumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('capa')
      .select('capa_number')
      .like('capa_number', `CAPA-${year}-%`)
      .order('capa_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].capa_number;
      const lastSeq = parseInt(lastNumber.split('-')[2] || '0');
      sequence = lastSeq + 1;
    }

    return `CAPA-${year}-${String(sequence).padStart(4, '0')}`;
  }
};

// OEE Service
export const oeeService = {
  async getBySessionId(sessionId: string): Promise<OEERecord | null> {
    const { data, error } = await supabase
      .from('oee_records')
      .select('*')
      .eq('production_session_id', sessionId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(record: Omit<OEERecord, 'id' | 'created_at' | 'calculated_at' | 'availability' | 'performance' | 'quality' | 'oee'>): Promise<OEERecord> {
    const { data: { user } } = await supabase.auth.getUser();

    const plannedTime = record.planned_production_time_minutes || 0;
    const runTime = record.run_time_minutes || 0;
    const operatingTime = record.operating_time_minutes || 0;
    const idealRate = record.ideal_run_rate || 1;
    const totalOutput = record.total_output || 0;
    const goodOutput = record.good_output || 0;

    const availability = plannedTime > 0 ? Math.round((runTime / plannedTime) * 100 * 100) / 100 : 0;
    const performance = runTime > 0 ? Math.round((totalOutput / (runTime * idealRate)) * 100 * 100) / 100 : 0;
    const quality = totalOutput > 0 ? Math.round((goodOutput / totalOutput) * 100 * 100) / 100 : 0;
    const oee = Math.round((availability * performance * quality) / 100) / 100;

    const { data, error } = await supabase
      .from('oee_records')
      .insert({
        ...record,
        availability,
        performance,
        quality,
        oee,
        calculated_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, record: Partial<OEERecord>): Promise<OEERecord> {
    const { data, error } = await supabase
      .from('oee_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSummary(filters?: { startDate?: string; endDate?: string; lineId?: string }) {
    let query = supabase
      .from('oee_records')
      .select('oee, availability, performance, quality');

    if (filters?.startDate) query = query.gte('calculation_date', filters.startDate);
    if (filters?.endDate) query = query.lte('calculation_date', filters.endDate);
    if (filters?.lineId) query = query.eq('line_id', filters.lineId);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return { avgOEE: 0, avgAvailability: 0, avgPerformance: 0, avgQuality: 0, count: 0 };
    }

    return {
      avgOEE: Math.round(data.reduce((sum: number, r: OEERecord) => sum + (r.oee || 0), 0) / data.length * 100) / 100,
      avgAvailability: Math.round(data.reduce((sum: number, r: OEERecord) => sum + (r.availability || 0), 0) / data.length * 100) / 100,
      avgPerformance: Math.round(data.reduce((sum: number, r: OEERecord) => sum + (r.performance || 0), 0) / data.length * 100) / 100,
      avgQuality: Math.round(data.reduce((sum: number, r: OEERecord) => sum + (r.quality || 0), 0) / data.length * 100) / 100,
      count: data.length
    };
  }
};

// Batch Traceability Service
export const batchTraceabilityService = {
  async getBySessionId(sessionId: string): Promise<BatchTraceability[]> {
    const { data, error } = await supabase
      .from('batch_traceability')
      .select('*, dryers(dryer_name), trolleys(trolley_name), pallet_tracking(pallet_code)')
      .eq('production_session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByBatchCode(batchCode: string): Promise<BatchTraceability | null> {
    const { data, error } = await supabase
      .from('batch_traceability')
      .select('*')
      .eq('batch_code', batchCode)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(trace: Omit<BatchTraceability, 'id' | 'created_at' | 'updated_at'>): Promise<BatchTraceability> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('batch_traceability')
      .insert({
        ...trace,
        created_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, trace: Partial<BatchTraceability>): Promise<BatchTraceability> {
    const { data, error } = await supabase
      .from('batch_traceability')
      .update({ ...trace, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async traceFrom(batchCode: string): Promise<BatchTraceability[]> {
    const { data, error } = await supabase.rpc('trace_batch_downstream', { start_batch: batchCode });
    if (error) throw error;
    return data || [];
  },

  async traceTo(batchCode: string): Promise<BatchTraceability[]> {
    const { data, error } = await supabase.rpc('trace_batch_upstream', { start_batch: batchCode });
    if (error) throw error;
    return data || [];
  }
};
